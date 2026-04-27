import { getLatestLinkedinData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  let data = null;
  let currentLang = localStorage.getItem("lang") || "en";

  try {
    const res = await getLatestLinkedinData();
    data = res?.data;

    if (!data) throw new Error("No data received");

    renderAll();
    bindCopyButtons(); // 👈 مهم
  } catch (err) {
    console.error("API Error:", err);
  }

  function renderAll() {
    renderHero();
    renderProfileIntro();
    renderAbout();
    renderExperience();
    renderFeatured();
    renderSkills();
    renderEducation();
    renderCertifications();
    renderProjects();
  }

  /* ================= HERO ================= */
  function renderHero() {
    const intro = data?.profileIntro?.[currentLang];
    if (!intro) return;

    set("headlineValue", intro.headline);
    set("qp1Value", intro.currentPosition);
    set("qp2Value", intro.location);
    set("qp3Value", intro.industry);
    set("qp4Value", intro.educationDisplayLine);
  }

  /* ================= PROFILE INTRO ================= */
  function renderProfileIntro() {
    const container = document.getElementById("profileIntroGrid");
    const intro = data?.profileIntro?.[currentLang];

    if (!container || !intro) return;

    container.innerHTML = "";

    const fields = [
      intro.headline,
      intro.currentPosition,
      intro.location,
      intro.industry,
      intro.contactInfoWording,
      intro.openToWorkOrServices,
    ];

    fields.forEach((value) => {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = value || "";
      container.appendChild(div);
    });
  }

  /* ================= ABOUT ================= */
  function renderAbout() {
    set("aboutContent", data?.about?.[currentLang]?.content || "");
  }

  /* ================= EXPERIENCE ================= */
  function renderExperience() {
    const list = document.getElementById("experienceList");
    const exp = data?.experience?.[currentLang] || [];

    if (!list) return;

    list.innerHTML = exp
      .map(
        (job) => `
        <div class="card">
          <h4>${job.jobTitle || ""} - ${job.companyName || ""}</h4>
          <p>${job.location || ""} | ${job.employmentPeriod || ""}</p>
          <p>${job.linkedinReadyContent || ""}</p>
        </div>
      `,
      )
      .join("");
  }

  /* ================= FEATURED ================= */
  function renderFeatured() {
    const list = document.getElementById("featuredList");
    const items = data?.featured?.[currentLang] || [];

    if (!list) return;

    list.innerHTML = items
      .map(
        (item) => `
        <div class="card">
          <h4>${item.title || ""}</h4>
          <p>${item.description || ""}</p>
        </div>
      `,
      )
      .join("");
  }

  /* ================= SKILLS ================= */
  function renderSkills() {
    const list = document.getElementById("skillsList");
    const skills = data?.skills?.[currentLang]?.items || [];

    if (!list) return;

    list.innerHTML = `
      <div class="card">
        ${skills.map((s) => `<span class="tag">${s}</span>`).join("")}
      </div>
    `;
  }

  /* ================= EDUCATION ================= */
  function renderEducation() {
    const list = document.getElementById("educationList");
    const edu = data?.education?.[currentLang] || [];

    if (!list) return;

    list.innerHTML = edu
      .map(
        (e) => `
        <div class="card">
          <h4>${e.degree || ""}</h4>
          <p>${e.institution || ""} - ${e.graduationYear || ""}</p>
        </div>
      `,
      )
      .join("");
  }

  /* ================= CERTIFICATIONS ================= */
  function renderCertifications() {
    const list = document.getElementById("certificationsList");
    const certs = data?.certifications?.[currentLang] || [];

    if (!list) return;

    list.innerHTML =
      certs.length > 0
        ? certs
            .map(
              (c) => `
          <div class="card">
            <p>${c.linkedinReadyContent || ""}</p>
          </div>
        `,
            )
            .join("")
        : "<p>No certifications</p>";
  }

  /* ================= PROJECTS ================= */
  function renderProjects() {
    const list = document.getElementById("projectsList");
    const projects = data?.projects?.[currentLang] || [];

    if (!list) return;

    list.innerHTML =
      projects.length > 0
        ? projects
            .map(
              (p) => `
            <div class="card">
              <h4>${p.title || ""}</h4>
              <p>${p.linkedinReadyContent || ""}</p>
            </div>
          `,
            )
            .join("")
        : "<p>No projects</p>";
  }

  /* ================= COPY FUNCTIONS ================= */

  function copyText(text) {
    return navigator.clipboard.writeText(text);
  }

  function getSectionText(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return "";

    return section.innerText.trim();
  }

  function bindCopyButtons() {
    // Copy Section
    document.querySelectorAll(".section").forEach((section) => {
      const btn = section.querySelector(".ghost-btn");
      if (!btn) return;

      btn.addEventListener("click", async () => {
        const text = getSectionText(section.id);
        if (!text) return;

        await copyText(text);

        btn.textContent = currentLang === "ar" ? "تم النسخ" : "Copied";
        setTimeout(() => {
          btn.textContent = currentLang === "ar" ? "نسخ القسم" : "Copy Section";
        }, 1200);
      });
    });

    // Copy All
    const copyAllBtn = document.querySelector(".copy-panel button");

    if (copyAllBtn) {
      copyAllBtn.addEventListener("click", async () => {
        // alert("Copying...");
        const allText = Array.from(document.querySelectorAll(".section"))
          .map((sec) => getSectionText(sec.id))
          .join("\n\n");

        await copyText(allText);

        copyAllBtn.textContent = currentLang === "ar" ? "تم النسخ" : "Copied";

        setTimeout(() => {
          copyAllBtn.textContent =
            currentLang === "ar" ? "نسخ كل الأقسام" : "Copy All Sections";
        }, 1200);
      });
    }
  }

  /* ================= HELPER ================= */
  function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  }
});
