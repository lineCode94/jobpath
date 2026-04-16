import api from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("jobsContainer");
  const paginationEl = document.querySelector(".pagination-list");
  const form = document.querySelector(".job__search__section form");
  const tags = document.getElementById("tags");

  if (!container || !paginationEl || !form) return;

  let lang = localStorage.getItem("lang") || "en";
  let currentPage = 1;

  /* ================= FILTER STATE ================= */
  let filters = {
    search: "",
    location: "",
    jobTypes: [],
    datePosted: "",
    tags: [],
    salaryRanges: [],
  };

  /* ================= FETCH JOBS ================= */
  async function fetchJobs(page = 1) {
    try {
      console.log("🔥 FILTERS:", filters);

      const res = await api.get("/jobs/public", {
        params: {
          lang,
          page,
          limit: 10,
          query: filters.search || undefined,
          location:
            filters.location && filters.location !== "All Locations"
              ? filters.location
              : undefined,
          employmentType:
            filters.jobTypes.length > 0
              ? filters.jobTypes.join(",")
              : undefined,
          datePosted: filters.datePosted || undefined,
          tags: filters.tags.length > 0 ? filters.tags.join(",") : undefined,
          salaryRange:
            filters.salaryRanges.length > 0
              ? filters.salaryRanges.join(",")
              : undefined,
        },
      });

      return res.data;
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      return null;
    }
  }

  /* ================= FETCH FILTER OPTIONS ================= */
async function fetchFilters() {
  try {
    const res = await api.get("/jobs/filter-options", {
      params: {
        lang,
      },
    });

    return res.data;
  } catch (err) {
    console.error("❌ Error fetching filters:", err);
    return null;
  }
}

  /* ================= APPLY FILTER OPTIONS ================= */
  function applyFiltersUI(data) {
    // ===== Locations =====
    const locationList = document.querySelector("#locationSelect .list");

    if (locationList) {
      locationList.innerHTML = `
        <li class="option" data-value="">All Locations</li>
        ${data.locations
          .map((loc) => `<li class="option" data-value="${loc}">${loc}</li>`)
          .join("")}
      `;
    }

    // ===== Date Posted =====
    const dateList = document
      .getElementById("dateSelect")
      ?.querySelector(".list");

    if (dateList) {
      dateList.innerHTML = `
        <li class="option" data-value="">Any Time</li>
        ${data.datePostedOptions
          .map((d) => `<li class="option" data-value="${d}">${d}</li>`)
          .join("")}
      `;
    }

    // ===== Job Types =====
  const jobTypeContainer = document.getElementById("jobTypeContainer");

    if (jobTypeContainer && data.employmentTypes) {
      jobTypeContainer.innerHTML = data.employmentTypes
        .map(
          (type) => `
        <div class="d-flex align-items-center justify-content-between list">
          <div class="d-flex gap-2 align-items-center checkbox">
            <input 
            type="checkbox" 
            class="job-type-checkbox" 
            value="${type}" 
            id="${type}" />
            <label for="${type}">${type}</label>
          </div>
        </div>
      `,
        )
        .join("");
    }

    // ===== TAGS =====
const tagsList = document.querySelector("#tagsSelect .list");

if (tagsList && data.tags) {
  tagsList.innerHTML = `
    <li class="option" data-value="">All Categories</li>
    ${data.tags
      .map(
        (tag) => `
        <li class="option" data-value="${tag}">
          ${tag}
        </li>
      `,
      )
      .join("")}
  `;
}
    // ===== SALARY =====
    const salaryContainer = document.getElementById("salaryContainer");

   if (salaryContainer && data.salaryRanges) {
     salaryContainer.innerHTML = data.salaryRanges
       .map((salary, index) => {
         // نخلي القيمة raw زي ما الباك اند متوقعها (مهم جدًا)
         const value = salary.replace(/\s+/g, "");

         const id = `salary_${index}`;

         return `
        <div class="d-flex align-items-center justify-content-between list">
          <div class="d-flex gap-2 align-items-center checkbox">
            <input 
              type="checkbox" 
              class="salary-checkbox" 
              id="${id}" 
              value="${value}" 
            />
            <label for="${id}">${salary}</label>
          </div>
        </div>
      `;
       })
       .join("");
   }

    bindNiceSelectEvents();
  }

  /* ================= LOCATION SEARCH ================= */
function enableLocationSearch() {
  const searchInput = document.getElementById("locationSearch");
  const dropdown = document.getElementById("locationSelect");

  if (!searchInput) return;

  // 🔥 منع القفل
  searchInput.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  dropdown?.addEventListener("click", (e) => {
    if (e.target.id === "locationSearch") {
      e.stopPropagation();
    }
  });

  // 🔥 الفلترة
  searchInput.addEventListener("keyup", function () {
    const value = this.value.toLowerCase();

    document.querySelectorAll("#locationSelect .option").forEach((item) => {
      item.style.display = item.textContent.toLowerCase().includes(value)
        ? ""
        : "none";
    });
  });
}
  /* ================= NICE SELECT ================= */
  function bindNiceSelectEvents() {
    document.querySelectorAll(".nice-select .option").forEach((opt) => {
      opt.addEventListener("click", function () {
        const parent = this.closest(".nice-select");
        const value = this.getAttribute("data-value") ?? "";
        const text = this.textContent;

        parent.querySelector(".current").textContent = text;

        // LOCATION
        if (parent.id === "locationSelect") {
          filters.location = value;
        }

        // DATE
        if (parent.id === "dateSelect") {
          filters.datePosted = value;
        }
      });
    });
  }

  /* ================= GET VALUES ================= */
function getJobTypes() {
  return Array.from(
    document.querySelectorAll(".job-type-checkbox:checked"),
  ).map((el) => el.value);
}

  function getTags() {
    return Array.from(document.querySelectorAll(".tag-checkbox:checked")).map(
      (el) => el.id,
    );
  }

function getSalaries() {
  return Array.from(document.querySelectorAll(".salary-checkbox:checked")).map(
    (el) => {
      return el.value.replace(/\s+/g, "");
    },
  );
}

  /* ================= RENDER JOBS ================= */
  function renderJobs(jobs) {
    container.innerHTML = "";

    jobs.forEach((job) => {
      const title = lang === "ar" ? job.titleAR : job.titleEN;
      const company = lang === "ar" ? job.companyName : job.companyNameEN;
      const location = lang === "ar" ? job.locationAR : job.locationEN;
      const type = lang === "ar" ? job.employmentType : job.employmentTypeEN;

      container.innerHTML += `
        <div class="col-lg-12 col-xxl-6">
          <div class="rts__job__card__big style__gradient d-flex gap-4 align-items-center">
            <div class="company__icon">
              <img src="assets/img/home-1/company/google.svg">
            </div>

            <div class="job__meta d-flex flex-column gap-2">
              <a class="job__title h6 mb-0">
                ${title} - ${company}
              </a>

              <div class="d-flex gap-3 flex-wrap mb-2">
                <div>${location || "-"}</div>
                <div>${type || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  /* ================= PAGINATION ================= */
  function renderPagination({ page, totalPages }) {
    currentPage = page;
    paginationEl.innerHTML = "";

    paginationEl.innerHTML += `
      <li>
        <a href="#" class="${page === 1 ? "inactive" : ""}" data-page="${page - 1}">
          <i class="rt-chevron-left"></i>
        </a>
      </li>
    `;

    let end = Math.min(5, totalPages);

    for (let i = 1; i <= end; i++) {
      paginationEl.innerHTML += `
        <li>
          <a href="#" class="${i === page ? "active" : ""}" data-page="${i}">
            ${i}
          </a>
        </li>
      `;
    }

    if (totalPages > 5) {
      paginationEl.innerHTML += `<li><span>...</span></li>`;
      paginationEl.innerHTML += `
        <li>
          <a href="#" data-page="${totalPages}">${totalPages}</a>
        </li>
      `;
    }

    paginationEl.innerHTML += `
      <li>
        <a href="#" class="${page === totalPages ? "inactive" : ""}" data-page="${page + 1}">
          <i class="rt-chevron-right"></i>
        </a>
      </li>
    `;
  }

  /* ================= PAGINATION CLICK ================= */
  paginationEl.addEventListener("click", async (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    e.preventDefault();

    const targetPage = parseInt(link.dataset.page);
    if (!targetPage) return;

    const data = await fetchJobs(targetPage);
    if (!data) return;

    renderJobs(data.jobs);
    renderPagination(data.pagination);
  });

  /* ================= SUBMIT FILTER ================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    filters.search = document.getElementById("search").value || "";
    filters.jobTypes = getJobTypes();
    filters.tags = getTags();
    filters.salaryRanges = getSalaries();

    // 🔥 مهم
    const locationText = document.querySelector(
      "#locationSelect .current",
    )?.textContent;

    filters.location = locationText === "Search Location" ? "" : locationText;

    const dateText = document.querySelector(
      "#dateSelect .current",
    )?.textContent;

    filters.datePosted = dateText === "Date Posted" ? "" : dateText;

    const data = await fetchJobs(1);
    if (!data) return;

    renderJobs(data.jobs);
    renderPagination(data.pagination);
  });

  /* ================= INIT ================= */
  const filtersData = await fetchFilters();
  if (filtersData) {
    applyFiltersUI(filtersData);
    enableLocationSearch();
  }

  const data = await fetchJobs(1);
  if (!data) return;

  renderJobs(data.jobs);
  renderPagination(data.pagination);
});
