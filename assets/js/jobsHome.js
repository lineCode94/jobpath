import { getJobsList } from "./api.js";

// ========== Render Jobs on Home Page ==========
async function loadJobs() {
  const lang = localStorage.getItem("lang") || "ar";
  const jobsContainer = document.getElementById("jobsContainer");

  try {
    const res = await getJobsList(lang);

    // Read correct array based on backend response
    const jobs = res?.data?.arJobs || [];

    if (!jobs.length) {
      jobsContainer.innerHTML = `<p class="text-center mt-4">لا توجد وظائف حالياً</p>`;
      return;
    }
    // console.log(jobs)

    jobsContainer.innerHTML = jobs
      .map(
        (job) => `
      <div class="col-lg-6 col-xl-4 col-md-6">
        <div class="rts__job__card" data-job-id="${job.jobId}">
          
          <div class="d-flex align-items-center justify-content-between">
            <div class="company__icon">
              <img src="${
                job.companyLogoUrl || "assets/img/home-1/company/google.svg"
              }" 
                   alt="${job.companyName}" />
            </div>

            <div class="featured__option">
              ${job.badgeType === "featured" ? `<span>مميز</span>` : ``}
            </div>
          </div>

          <div class="d-flex gap-3 mt-4 flex-wrap">
            <div class="d-flex gap-1 align-items-center">
              <i class="fa-light fa-location-dot"></i>
              <span>${job.locationAR || "—"}</span>
            </div>

            <div class="d-flex gap-1 align-items-center">
              <i class="fa-light fa-briefcase"></i>
              <span>${job.employmentType || "—"}</span>
            </div>
          </div>

          <div class="h6 job__title my-3">
            <a href="javascript:void(0)">
              ${job.titleAR}
            </a>
          </div>

          <p>${job.shortDescriptionAR || ""}</p>

          <div class="job__tags d-flex flex-wrap gap-3 mt-4">
            ${
              job.tagsAR
                ?.map((tag) => `<a href="#" class="badge">${tag}</a>`)
                .join("") || ""
            }
          </div>

        </div>
      </div>
    `
      )
      .join("");

    activateCardClicks();
  } catch (error) {
    console.error(error);
    jobsContainer.innerHTML = `<p class="text-danger mt-4 text-center">حدث خطأ أثناء تحميل الوظائف</p>`;
  }
}

// ========== Make Cards Clickable ==========
function activateCardClicks() {
  document.querySelectorAll(".rts__job__card").forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const jobId = card.getAttribute("data-job-id");
      window.location.href = `job-details-2.html?id=${jobId}`;
    });
  });
}

// Run on load
loadJobs();
