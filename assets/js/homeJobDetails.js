// homeJobDetails.js
import { getSingleJob } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("pageLoader");

  const showLoader = () => loader && (loader.style.display = "block");
  const hideLoader = () => loader && (loader.style.display = "none");

  showLoader();

  try {
    const params = new URLSearchParams(window.location.search);

    const jobId = params.get("id");
    const urlLang = params.get("lang");
    const lang = urlLang || localStorage.getItem("lang") || "en";

    localStorage.setItem("lang", lang);

    if (!jobId) throw new Error("No Job ID");

    const el = (...ids) => {
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element) return element;
      }
      return null;
    };

    const safe = (v) => {
      if (!v || v === "غير محدد" || v === "Not Specified") return "";
      return v;
    };

    const pick = (obj, enKey, arKey) => {
      const en = safe(obj?.[enKey]);
      const ar = safe(obj?.[arKey]);
      return lang === "ar" ? ar || en : en || ar;
    };

    const formatDate = (d) => {
      if (!d) return lang === "ar" ? "غير محدد" : "Not specified";
      return new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
    };

    // ================= API =================

    const response = await getSingleJob(jobId, lang);
    // console.log("FULL RESPONSE:", response);

    const job = response?.job ?? response;
    if (!job) throw new Error("Job not found");

    // console.log("JOB OBJECT:", job);

    // ================= HEADER =================

    const titleVal = pick(job, "titleEN", "titleAR") || safe(job.companyName);

    const jobTitleEl = el("jobTitle");
    if (jobTitleEl) {
      jobTitleEl.dataset.en = job.titleEN || job.titleAR || "";
      jobTitleEl.dataset.ar = job.titleAR || job.titleEN || "";
      jobTitleEl.textContent =
        lang === "ar" ? jobTitleEl.dataset.ar : jobTitleEl.dataset.en;
    }

    const locationVal = pick(job, "locationEN", "locationAR");

    el("jobLocation") && (el("jobLocation").textContent = locationVal);

    el("jobSalary") &&
      (el("jobSalary").textContent =
        safe(job.salaryRange) ||
        (lang === "ar" ? "غير محدد" : "Not specified"));

    const dateSrc = job.lastTranslatedAt ?? job.createdAt ?? job.updatedAt;

    el("jobDate") && (el("jobDate").textContent = formatDate(dateSrc));
    // ================= JOB OVERVIEW =================

    el("jobVacancy") &&
      (el("jobVacancy").textContent =
        safe(job.vacancy) || (lang === "ar" ? "غير محدد" : "Not specified"));

    el("jobExperienceOverview") &&
      (el("jobExperienceOverview").textContent =
        safe(job.experience) || (lang === "ar" ? "غير محدد" : "Not specified"));

    el("jobSalaryOverview") &&
      (el("jobSalaryOverview").textContent =
        safe(job.salaryRange) ||
        (lang === "ar" ? "غير محدد" : "Not specified"));

    el("jobDeadline") &&
      (el("jobDeadline").textContent = job.deadline
        ? formatDate(job.deadline)
        : lang === "ar"
          ? "غير محدد"
          : "Not specified");

    el("jobQualification") &&
      (el("jobQualification").textContent =
        safe(job.qualification) ||
        (lang === "ar" ? "غير محدد" : "Not specified"));

    el("jobLocationOverview") &&
      (el("jobLocationOverview").textContent =
        pick(job, "locationEN", "locationAR") ||
        (lang === "ar" ? "غير محدد" : "Not specified"));

    el("jobGender") &&
      (el("jobGender").textContent =
        safe(job.gender) || (lang === "ar" ? "غير محدد" : "Not specified"));

    // ================= LOGO =================

    const logoEl = el("companyLogo");

    if (logoEl) {
      if (job.companyLogoUrl) {
        logoEl.src = job.companyLogoUrl;
        logoEl.alt = job.companyName || "Company Logo";
      } else {
        logoEl.src = "assets/img/default-company.png"; // حط صورة افتراضية
      }
    }
    // ================= TAGS =================

    const tagsContainer = el("jobTags");

    if (tagsContainer) {
      tagsContainer.innerHTML = "";

      let tags =
        lang === "ar" ? job.tagsAR || job.tagsEn : job.tagsEn || job.tagsAR;

      if (typeof tags === "string") {
        tags = tags.split(",").map((t) => t.trim());
      }

      if (Array.isArray(tags) && tags.length > 0) {
        tags.forEach((tag) => {
          const a = document.createElement("a");
          a.href = "#";
          a.textContent = tag;
          tagsContainer.appendChild(a);
        });
      }
    }

    // ================= DESCRIPTION =================

    el("jobShortDescription") &&
      (el("jobShortDescription").textContent =
        pick(job, "shortDescriptionEN", "shortDescriptionAR") ||
        (lang === "ar"
          ? "لا يوجد وصف قصير"
          : "No short description available"));

    el("jobFullDescription") &&
      (el("jobFullDescription").textContent =
        pick(job, "fullDescriptionEN", "fullDescriptionAR") ||
        (lang === "ar" ? "لا يوجد وصف كامل" : "No full description available"));

    // ================= RELATED JOBS =================

    const relatedContainer = el("relatedJobsContainer");
    const relatedTitle = el("relatedJobsTitle");

    if (relatedTitle) {
      relatedTitle.textContent =
        lang === "ar" ? "وظائف مشابهة" : "Related Jobs";
    }

    if (relatedContainer) {
      relatedContainer.innerHTML = "";

      // 🔥 نحاول كل الاحتمالات
      let related =
        job.relatedJobs ||
        job.related ||
        job.similarJobs ||
        response?.relatedJobs ||
        response?.data?.relatedJobs;

      // console.log("RELATED RAW:", related);

      // لو object نحوله array
      if (related && !Array.isArray(related) && typeof related === "object") {
        related = Object.values(related);
      }

      if (!Array.isArray(related) || related.length === 0) {
        relatedContainer.innerHTML = `
          <p style="padding:20px 0;">
            ${
              lang === "ar"
                ? "لا يوجد وظائف مشابهة"
                : "No related jobs available"
            }
          </p>
        `;
      } else {
       related.forEach((rJob) => {
         const id = rJob.jobId ?? rJob.id ?? rJob.job_id;
         if (!id) return;

         const rTitle =
           pick(rJob, "titleEN", "titleAR") || safe(rJob.companyName);

         const rLocation =
           pick(rJob, "locationEN", "locationAR") ||
           (lang === "ar" ? "غير محدد" : "Not specified");

         const rType =
           safe(rJob.jobType) || (lang === "ar" ? "غير محدد" : "Not specified");

         const logo = "/assets/img/home-1/company/google.svg";

         const wrapper = document.createElement("div");
         wrapper.className =
           "d-flex gap-4 mt-4 align-items-center flex-sm-row flex-column mx-auto mx-sm-0";

         wrapper.innerHTML = `
    <div class="company__icon recent__post">
      <img src="${logo}" alt="company logo">
    </div>

    <div class="job__meta w-100 d-flex text-center text-sm-start flex-column gap-2">
      <div>
        <a href="job-details.html?id=${id}&lang=${lang}" 
           class="job__title h6 fw-semibold mb-0">
          ${rTitle}
        </a>
      </div>

      <div class="d-flex gap-3 justify-content-center justify-content-sm-start flex-wrap">
        <div class="d-flex gap-2 align-items-center">
          <i class="fa-light fa-location-dot"></i>
          ${rLocation}
        </div>

        <div class="d-flex gap-2 align-items-center">
          <i class="fa-light rt-briefcase"></i>
          ${rType}
        </div>
      </div>
    </div>
  `;

         relatedContainer.appendChild(wrapper);
       });

      }
    }

    // ================= APPLY =================

    const applyBtn = el("applyJobBtn");

    if (applyBtn) {
      applyBtn.textContent =
        lang === "ar" ? "قدم على هذه الوظيفة" : "Apply This Position";

      applyBtn.addEventListener("click", () => {
        const email = safe(job.emailToApply) || "hr@company.com";

        const subject =
          lang === "ar"
            ? `التقدم لوظيفة ${titleVal}`
            : `Applying for ${titleVal}`;

        const body =
          lang === "ar"
            ? `السلام عليكم،

أرغب في التقدم لوظيفة ${titleVal}.

شكراً لكم.`
            : `Hello,

I would like to apply for the position of ${titleVal}.

Thank you.`;

        window.location.href = `mailto:${email}?subject=${encodeURIComponent(
          subject,
        )}&body=${encodeURIComponent(body)}`;
      });
    }

    // console.log("✅ Page Rendered Successfully");
  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    hideLoader();
  }
  // ================= LANG SWITCH =================
  // ================= LANG SWITCH =================
const langSwitch = document.getElementById("langSwitch");

function getCurrentLang() {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get("lang");

  if (urlLang) {
    localStorage.setItem("lang", urlLang);
    return urlLang;
  }

  return localStorage.getItem("lang") || "en";
}

function updateDirection(lang) {
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang);
}

function updateLangButton() {
  const currentLang = getCurrentLang();

  if (!langSwitch) return;

  langSwitch.textContent = currentLang === "en" ? "Arabic" : "English";
}

function translateStaticContent(lang) {
  const elements = document.querySelectorAll("[data-en][data-ar]");

  elements.forEach(el => {
    const text =
      lang === "ar"
        ? el.getAttribute("data-ar")
        : el.getAttribute("data-en");

    // لو العنصر فيه أيقونة جواه، منغير innerHTML
    if (el.children.length === 0) {
      el.textContent = text;
    } else {
      const textNode = Array.from(el.childNodes).find(
        node => node.nodeType === 3
      );
      if (textNode) textNode.nodeValue = " " + text;
    }
  });
}

// أول تحميل
let currentLang = getCurrentLang();
updateDirection(currentLang);
updateLangButton();
translateStaticContent(currentLang);

// عند الضغط
if (langSwitch) {
  langSwitch.addEventListener("click", () => {
    const currentLang = getCurrentLang();
    const newLang = currentLang === "en" ? "ar" : "en";

    localStorage.setItem("lang", newLang);

    const params = new URLSearchParams(window.location.search);
    params.set("lang", newLang);

    window.location.search = params.toString();
  });
}


});
