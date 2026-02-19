import { getJobsList, getUserDetails } from "./api.js";

/* ================== AUTH HELPERS ================== */
async function isLoggedIn() {
  try {
    await getUserDetails(); // cookie auto sent
    return true;
  } catch {
    return false;
  }
}

function openLoginModal() {
  const modalEl = document.getElementById("loginModal");
  if (!modalEl) {
    console.error("❌ Login modal not found");
    return;
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

/* ================== HELPERS ================== */
function normalizeTags(tags) {
  if (!tags) return [];

  if (Array.isArray(tags)) return tags;

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return [];
}

/* ================== Render Jobs ================== */
async function loadJobs() {
  const lang = localStorage.getItem("lang") || "en";
  const jobsContainer = document.getElementById("jobsContainer");

  try {
    const res = await getJobsList(lang);
    console.log("JOBS RESPONSE =>", res);

    let jobs = [];

    if (lang === "ar") {
      jobs = res?.data?.arJobs;
      if (!jobs || !jobs.length) {
        jobs = res?.data?.enJobs || [];
      }
    } else {
      jobs = res?.data?.enJobs || [];
    }

    if (!jobs.length) {
      jobsContainer.innerHTML = `
        <p class="text-center mt-4">
          ${lang === "ar" ? "لا توجد وظائف حالياً" : "No jobs available"}
        </p>
      `;
      return;
    }

    jobsContainer.innerHTML = jobs
      .map((job) => {
        const tags = normalizeTags(lang === "ar" ? job.tagsAR : job.tagsEN);

        return `
        <div class="col-lg-6 col-xl-4 col-md-6">
          <div class="rts__job__card" data-job-id="${job.jobId}">
            
            <div class="d-flex align-items-center justify-content-between">
              <div class="company__icon">
                <img 
                  src="assets/img/home-1/company/google.svg"
                  alt="${job.companyNameEN || job.companyNameAR || ""}" 
                />
              </div>

              <div class="featured__option">
                ${
                  job.badgeType === "featured"
                    ? `<span>${lang === "ar" ? "مميز" : "Featured"}</span>`
                    : ``
                }
              </div>
            </div>

            <div class="d-flex gap-3 mt-4 flex-wrap">
              <div class="d-flex gap-1 align-items-center">
                <i class="fa-light fa-location-dot"></i>
                <span>${job.locationAR || job.locationEN || "—"}</span>
              </div>

              <div class="d-flex gap-1 align-items-center">
                <i class="fa-light fa-briefcase"></i>
                <span class="text-capitalize">
                  ${
                    lang === "ar"
                      ? job.employmentType || job.employmentTypeEN || "—"
                      : job.employmentTypeEN || job.employmentType || "—"
                  }
                </span>
              </div>
            </div>

            <div class="h6 job__title my-3">
              <a href="javascript:void(0)">
                ${lang === "ar" ? job.titleAR : job.titleEN}
              </a>
            </div>

            <p>
              ${
                lang === "ar"
                  ? job.shortDescriptionAR || ""
                  : job.shortDescriptionEN || ""
              }
            </p>

            <div class="job__tags d-flex flex-wrap gap-3 mt-4">
              ${
                tags.length
                  ? tags
                      .map((tag) => `<a href="#" class="badge">${tag}</a>`)
                      .join("")
                  : ""
              }
            </div>

          </div>
        </div>
      `;
      })
      .join("");

    activateCardClicks();
  } catch (error) {
    console.error(error);
    jobsContainer.innerHTML = `
      <p class="text-danger mt-4 text-center">
        ${lang === "ar" ? "حدث خطأ أثناء تحميل الوظائف" : "Error loading jobs"}
      </p>
    `;
  }
}

/* ================== Card Click Logic ================== */
function activateCardClicks() {
  document.querySelectorAll(".rts__job__card").forEach((card) => {
    card.style.cursor = "pointer";

    card.addEventListener("click", async () => {
      const jobId = card.getAttribute("data-job-id");
      const lang = localStorage.getItem("lang") || "en";

      const loggedIn = await isLoggedIn();

      if (!loggedIn) {
        openLoginModal();

        localStorage.setItem(
          "redirectAfterLogin",
          `job-details.html?id=${jobId}&lang=${lang}`,
        );
        return;
      }

      window.location.href = `job-details.html?id=${jobId}&lang=${lang}`;
    });
  });
}

/* ================== INIT ================== */
loadJobs();
