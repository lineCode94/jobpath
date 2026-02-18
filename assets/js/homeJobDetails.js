// homeJobDetails.js
import { getSingleJob } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");
  const lang = localStorage.getItem("lang") || "en";
  const el = (...ids) => {
    for (const id of ids) {
      const e = document.getElementById(id);
      if (e) return e;
    }
    return null;
  };

  const pick = (obj, enKey, arKey) => {
    if (lang === "ar") return obj?.[arKey] ?? obj?.[enKey] ?? "";
    return obj?.[enKey] ?? obj?.[arKey] ?? "";
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return lang === "ar" ? "غير محدد" : "Not specified";
    return new Date(dateVal).toLocaleDateString(
      lang === "ar" ? "ar-EG" : "en-US",
    );
  };

  const normalizeSalary = (salary) => {
    if (!salary || salary === "Not Specified")
      return lang === "ar" ? "غير محدد" : "Not specified";
    return salary;
  };

  const normalizeTags = (rawTags) => {
    if (Array.isArray(rawTags)) return rawTags;
    if (typeof rawTags === "string" && rawTags !== "Not Specified")
      return [rawTags];
    return [];
  };

  if (!jobId) {
    console.error("Job ID not provided in URL");
    return;
  }

  const response = await getSingleJob(jobId, lang);
  const job = response?.job ?? response;

  if (!job) {
    const detailsEl = document.querySelector(".rts__job__details");
    if (detailsEl)
      detailsEl.innerHTML = `<p>${
        lang === "ar" ? "الوظيفة غير موجودة" : "Job not found"
      }</p>`;
    return;
  }

  // ================= HEADER =================

  const logoEl = el("companyLogo", "companyLogoImg");
  if (logoEl)
    logoEl.src =
      job.companyLogoUrl || logoEl.src || "assets/img/home-1/company/apple.svg";

  const titleEl = el("jobTitle", "jobTitleText");
  const titleVal = pick(job, "titleEN", "titleAR") || job.companyName || "";
  if (titleEl) titleEl.textContent = titleVal;

  const locationEl = el("jobLocation", "jobLocationText");
  const locationVal = pick(job, "locationEN", "locationAR");
  if (locationEl) locationEl.textContent = locationVal;

  const typeEl = el("jobType", "jobTypeText");
  if (typeEl)
    typeEl.textContent =
      pick(job, "employmentTypeEN", "employmentType") ||
      job.employmentType ||
      "";

  const dateEl = el("jobDate", "jobPostedDate");
  const dateSrc = job.lastTranslatedAt ?? job.createdAt ?? job.updatedAt;
  if (dateEl) dateEl.textContent = formatDate(dateSrc);

  const salaryEl = el("jobSalary", "jobSalaryOverview");
  if (salaryEl) salaryEl.textContent = normalizeSalary(job.salaryRange);

  // ================= DESCRIPTIONS =================

  const shortText = el(
    "jobShortDescription",
    "jobShortDesc",
    "jobShortDescText",
  );
  const fullText = el("jobFullDescription", "jobFullDesc", "jobFullDescText");

  const shortDescVal =
    pick(job, "shortDescriptionEN", "shortDescriptionAR") ||
    job.short_description ||
    "";

  const fullDescVal =
    pick(job, "fullDescriptionEN", "fullDescriptionAR") ||
    job.description ||
    "";

  if (shortText)
    shortText.textContent =
      shortDescVal ||
      (lang === "ar" ? "لا يوجد وصف قصير" : "No short description available");

  if (fullText)
    fullText.textContent =
      fullDescVal ||
      (lang === "ar" ? "لا يوجد وصف كامل" : "No full description available");

  // ================= TAGS =================

  const tagsElement = el("jobTags", "tagsContainer");
  if (tagsElement) {
    tagsElement.innerHTML = "";

    const rawTags =
      lang === "ar" ? (job.tagsAR ?? job.tagsEN) : (job.tagsEN ?? job.tagsAR);

    const tagsArr = normalizeTags(rawTags);

    if (tagsArr.length) {
      tagsArr.forEach((t) => {
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = t;
        tagsElement.appendChild(a);
      });
    } else {
      tagsElement.textContent =
        lang === "ar" ? "لا توجد وسوم" : "No tags available";
    }
  }

  // ================= JOB OVERVIEW =================

  const overviewItems = document.querySelectorAll(".job__overview__content li");

  overviewItems.forEach((item) => {
    const textSpan = item.querySelector(".text");
    if (!textSpan) return;

    const txt = item.textContent || "";

    if (txt.includes("Date Posted") || txt.includes("تاريخ النشر")) {
      textSpan.textContent = formatDate(dateSrc);
    } else if (txt.includes("Vacancy") || txt.includes("الشاغر")) {
      textSpan.textContent = job.vacancy ?? job.vacancies ?? 1;
    } else if (txt.includes("Experience") || txt.includes("الخبرة")) {
      textSpan.textContent =
        pick(job, "experienceEN", "experience") ||
        (lang === "ar" ? "غير محدد" : "Not specified");
    } else if (txt.includes("Offered Salary") || txt.includes("الراتب")) {
      textSpan.textContent = normalizeSalary(job.salaryRange);
    } else if (txt.includes("Location") || txt.includes("الموقع")) {
      textSpan.textContent = locationVal;
    } else if (txt.includes("Gender") || txt.includes("النوع")) {
      textSpan.textContent = job.gender || (lang === "ar" ? "الكل" : "Both");
    }
  });

  // ================= APPLY =================

  const applyBtn = document.getElementById("applyJobBtn");

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const email = job.emailToApply || "hr@company.com";

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

      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoLink;
    });
  }

  // ================= RELATED JOBS =================

  const relatedContainer = document.getElementById("relatedJobsContainer");
  const relatedTitle = document.getElementById("relatedJobsTitle");

  if (relatedTitle) {
    relatedTitle.textContent = lang === "ar" ? "وظائف مشابهة" : "Related Jobs";
  }

  if (relatedContainer) {
    relatedContainer.innerHTML = "";

    const related = job.relatedJobs;

    if (!related || typeof related === "string" || related.length === 0) {
      const p = document.createElement("p");
      p.textContent =
        lang === "ar" ? "لا يوجد وظائف مشابهة" : "No related jobs available";
      relatedContainer.appendChild(p);
    } else if (Array.isArray(related)) {
      related.forEach((rJob) => {
        const card = document.createElement("div");
        card.className = "related-job-card";

        const rTitle = pick(rJob, "titleEN", "titleAR") || "";

        const rLocation = pick(rJob, "locationEN", "locationAR") || "";

        card.innerHTML = `
          <h6>${rTitle}</h6>
          <span>${rLocation}</span>
          <a href="job-details-2.html?id=${rJob.jobId}">
            ${lang === "ar" ? "عرض التفاصيل" : "View Details"}
          </a>
        `;

        relatedContainer.appendChild(card);
      });
    }
  }

  console.log("✅ Job details rendered successfully.");
});
