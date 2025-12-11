// homeJobDetails.js
import { getSingleJob } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");
  // افترض أن قيمة اللغة مخزنة زي "ar" أو "en"
  const lang = localStorage.getItem("lang") || "en"; // افتراضي "en"

  // helper: try multiple ids and return first found element
  const el = (...ids) => {
    for (const id of ids) {
      const e = document.getElementById(id);
      if (e) return e;
    }
    return null;
  };

  // helper to pick AR/EN value (if enVal missing, fallback to arVal and vice versa)
  const pick = (obj, enKey, arKey) => {
    if (lang === "ar") return obj[arKey] ?? obj[enKey] ?? "";
    return obj[enKey] ?? obj[arKey] ?? "";
  };

  // get description blocks (support different id names used in your HTML)
  const shortBlock = el(
    "shortDescriptionBlock",
    "shortDescBlock",
    "shortDescBlock",
    "shortDescBlock"
  );
  const fullBlock = el(
    "fullDescriptionBlock",
    "fullDescBlock",
    "fullDescBlock"
  );

  // get description text containers
  const shortText = el(
    "jobShortDescription",
    "jobShortDesc",
    "jobShortDescText"
  );
  const fullText = el("jobFullDescription", "jobFullDesc", "jobFullDescText");

  // ----- Tabs: show/hide (works with href="#shortDescriptionBlock" style or href="#all") -----
  const tabs = Array.from(document.querySelectorAll(".nav-link"));
  const setTabDisplay = (target) => {
    // default show both
    if (shortBlock) shortBlock.style.display = "block";
    if (fullBlock) fullBlock.style.display = "block";

    if (target === "all") {
      // both shown
      if (shortBlock) shortBlock.style.display = "block";
      if (fullBlock) fullBlock.style.display = "block";
    } else if (target === "shortDescriptionBlock" || target === "short") {
      if (shortBlock) shortBlock.style.display = "block";
      if (fullBlock) fullBlock.style.display = "none";
    } else if (target === "fullDescriptionBlock" || target === "full") {
      if (shortBlock) shortBlock.style.display = "none";
      if (fullBlock) fullBlock.style.display = "block";
    } else {
      // if target is an id that doesn't match short/full, keep both visible
      if (shortBlock) shortBlock.style.display = "block";
      if (fullBlock) fullBlock.style.display = "block";
    }
  };

  // attach click handlers for tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      // remove active from all then add to this
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // compute target - support href="#all" or data-tab attributes
      const href = tab.getAttribute("href") || "";
      const target =
        (tab.dataset.tab && tab.dataset.tab.trim()) ||
        (href.startsWith("#") ? href.replace("#", "") : href);

      setTabDisplay(target);
    });
  });

  // if there's an initially active tab, apply its logic
  const activeTab = document.querySelector(".nav-link.active");
  if (activeTab) {
    const href = activeTab.getAttribute("href") || "";
    const target =
      (activeTab.dataset.tab && activeTab.dataset.tab.trim()) ||
      (href.startsWith("#") ? href.replace("#", "") : href);
    setTabDisplay(target || "all");
  } else {
    setTabDisplay("all");
  }

  // ------------------ Fetch job ------------------
  if (!jobId) {
    console.error("Job ID not provided in URL");
    return;
  }

  const response = await getSingleJob(jobId, lang);
  // getSingleJob sometimes returns job object directly or wrapped { job: {...} }
  const job = response && response.job ? response.job : response;

  if (!job) {
    const detailsEl = document.querySelector(".rts__job__details");
    if (detailsEl) detailsEl.innerHTML = "<p>Job not found.</p>";
    console.error("Error fetching single job or job not found");
    return;
  }

  console.log("Loaded job object:", job); // يظهر object كما في console عندك

  // ----- HEADER fields (logo, title, location, type, salary, date) -----
  const logoEl = el("companyLogo", "companyLogoImg");
  if (logoEl)
    logoEl.src =
      job.companyLogoUrl || logoEl.src || "assets/img/home-1/company/apple.svg";

  const titleEl = el("jobTitle", "jobTitleText");
  const titleVal =
    pick(job, "titleEN", "titleAR") ||
    job.titleEN ||
    job.titleAR ||
    job.companyName ||
    "";
  if (titleEl) titleEl.textContent = titleVal;

  const locationEl = el("jobLocation", "jobLocationText");
  const locationVal =
    pick(job, "locationEN", "locationAR") ||
    job.locationEN ||
    job.locationAR ||
    "";
  if (locationEl) locationEl.textContent = locationVal;

  const typeEl = el("jobType", "jobTypeText");
  if (typeEl)
    typeEl.textContent = job.employmentType ?? job.employmentTypeEN ?? "";

  const dateEl = el("jobDate", "jobPostedDate");
  const dateSrc = job.lastTranslatedAt ?? job.createdAt ?? job.updatedAt;
  if (dateEl)
    dateEl.textContent = ` ${
      dateSrc ? new Date(dateSrc).toLocaleDateString() : "Not specified"
    }`;

  const salaryEl = el("jobSalary", "jobSalaryOverview");
  if (salaryEl) salaryEl.textContent = ` ${job.salaryRange ?? "Not specified"}`;

  // ----- DESCRIPTIONS -----
  // prefer language-specific fields; fallbacks to generic names if present
  const shortDescVal =
    pick(job, "shortDescriptionEN", "shortDescriptionAR") ||
    job.shortDescriptionEN ||
    job.shortDescriptionAR ||
    job.short_description ||
    "";
  const fullDescVal =
    pick(job, "fullDescriptionEN", "fullDescriptionAR") ||
    job.fullDescriptionEN ||
    job.fullDescriptionAR ||
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

  // ----- TAGS -----
  const tagsElement = el("jobTags", "tagsContainer");
  if (tagsElement) {
    tagsElement.innerHTML = "";
    const tagsArr =
      lang === "ar" ? job.tagsAR ?? job.tagsEN : job.tagsEN ?? job.tagsAR;
    if (Array.isArray(tagsArr) && tagsArr.length) {
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

  // ----- JOB OVERVIEW (right) -----
  const overviewItems = document.querySelectorAll(".job__overview__content li");
  overviewItems.forEach((item) => {
    const textSpan = item.querySelector(".text");
    if (!textSpan) return;

    const txt = item.textContent || "";

    if (txt.includes("Date Posted") || txt.includes("تاريخ النشر")) {
      textSpan.textContent = ` ${
        dateSrc ? new Date(dateSrc).toLocaleDateString() : "Not specified"
      }`;
    } else if (txt.includes("Vacancy") || txt.includes("الشاغر")) {
      textSpan.textContent = ` ${job.vacancy ?? job.vacancies ?? 1}`;
    } else if (txt.includes("Experience") || txt.includes("الخبرة")) {
      textSpan.textContent = ` ${
        job.experience ?? job.experienceEN ?? "Not specified"
      }`;
    } else if (txt.includes("Offered Salary") || txt.includes("الراتب")) {
      textSpan.textContent = ` ${job.salaryRange ?? "Not specified"}`;
    } else if (txt.includes("Location") || txt.includes("الموقع")) {
      textSpan.textContent = ` ${locationVal || "Not specified"}`;
    } else if (txt.includes("Gender") || txt.includes("النوع")) {
      textSpan.textContent = ` ${job.gender ?? "Both"}`;
    }
  });

  console.log("✅ Job details rendered.");
});
