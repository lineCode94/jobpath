import { cvCreate, cvBuild, getCvById, exportCv, cvPreview } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  let currentStep = Number(sessionStorage.getItem("cvCurrentStep")) || 1;

  const cvState = {
    id: sessionStorage.getItem("cvId") || null,
    templateId: sessionStorage.getItem("templateId")
      ? Number(sessionStorage.getItem("templateId"))
      : null,
    language: localStorage.getItem("lang") || "en",
  };

  // ================= TOAST =================
  function showToast(message, type = "success") {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: type === "error" ? "#dc3545" : "#28a745",
    }).showToast();
  }

  // ================= STEP 2 ELEMENT REFERENCES =================
  const fullName = document.getElementById("fullName");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const locationInput = document.getElementById("location");
  const linkedin = document.getElementById("linkedin");
  const github = document.getElementById("github");
  const summary = document.getElementById("summary");

  // ================= RESTORE CV =================
  async function restoreCvState() {
    if (!cvState.id) return;
    try {
      const res = await getCvById(cvState.id);
      const cv = res.data.data;
      console.log("RESTORE CV:", cv);

      if (cv.sections?.personalInfo) {
        fillStep2(cv);
        currentStep = 2;
      }

      if (cv.sections?.experience?.length) {
        fillStep3(cv);
        currentStep = 3;
      }

      if (cv.sections?.education?.length) {
        fillStep4(cv);
        currentStep = 4;
      }
      if (cv.sections?.skills?.length) {
        fillStep5(cv);
        currentStep = 5;
      }

      sessionStorage.setItem("cvCurrentStep", currentStep);
    } catch (err) {
      console.error(err);
      resetSession();
    }
  }

  function resetSession() {
    sessionStorage.clear();
    currentStep = 1;
  }

  // ================= STEP 1 =================
  const TEMPLATE_MAP = { modern: 1, classic: 2, creative: 3, minimal: 4 };
  const TEMPLATE_REVERSE_MAP = {
    1: "modern",
    2: "classic",
    3: "creative",
    4: "minimal",
  };

  function selectTemplate(card) {
    document
      .querySelectorAll(".template-card")
      .forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    const templateKey = card.dataset.template;
    const templateId = TEMPLATE_MAP[templateKey];
    if (!templateId) return showToast("Invalid template selected", "error");
    cvState.templateId = templateId;
    sessionStorage.setItem("templateId", templateId);
  }

  document
    .querySelectorAll(".template-card")
    .forEach((card) =>
      card.addEventListener("click", () => selectTemplate(card)),
    );

  if (cvState.templateId) {
    const key = TEMPLATE_REVERSE_MAP[cvState.templateId];
    const card = document.querySelector(
      `.template-card[data-template="${key}"]`,
    );
    if (card) card.classList.add("selected");
  }

  async function submitStep1() {
    if (!cvState.templateId)
      return showToast("Please select a template first", "error");
    if (cvState.id) return goToStep(2);
    try {
      const res = await cvCreate({
        templateId: cvState.templateId,
        language: cvState.language,
      });
      cvState.id = res.data.data.id;
      sessionStorage.setItem("cvId", cvState.id);
      showToast("Template saved");
      goToStep(2);
    } catch {
      showToast("Failed to create CV", "error");
    }
  }

  // ================= STEP 2 =================
  function fillStep2(cv) {
    const personal = cv.sections?.personalInfo || {};
    fullName.value = personal.fullName ?? "";
    email.value = personal.email ?? "";
    phone.value = personal.phone ?? "";
    locationInput.value = personal.city ?? "";
    linkedin.value = personal.linkedin ?? "";
    github.value = personal.portfolio ?? "";
    summary.value = cv.sections?.summary ?? "";
  }

  async function submitStep2() {
    try {
      if (!cvState.id) await submitStep1();
      await cvBuild({
        cvId: cvState.id,
        status: "draft",
        cvJson: {
          personalInfo: {
            fullName: fullName.value,
            email: email.value,
            phone: phone.value,
            city: locationInput.value,
            linkedin: linkedin.value,
            portfolio: github.value,
          },
          summary: summary.value,
        },
      });
      showToast("Personal info saved");
      goToStep(3);
    } catch {
      showToast("Failed to save personal info", "error");
    }
  }

  // ================= STEP 3 =================
  function collectExperienceData() {
    const items = document.querySelectorAll("#experienceList .list-item");
    return Array.from(items).map((item) => ({
      jobTitle: item.querySelector(".experience-title")?.value || "",
      company: item.querySelector(".experience-company")?.value || "",
      location: item.querySelector(".experience-location")?.value || "",
      from: item.querySelector(".experience-start-date")?.value || "",
      to: item.querySelector(".experience-end-date")?.value || "",
      // isCurrent: item.querySelector(".experience-current")?.checked || false,
      brief: item.querySelector(".experience-description")?.value || "",
    }));
  }

  function fillStep3(cv) {
    const list = document.getElementById("experienceList");
    if (!list) return;
    list.innerHTML = "";
    const experiences = cv.sections?.experience || [];
    if (!experiences.length) list.innerHTML = createExperienceItem(0);
    experiences.forEach((exp, idx) =>
      list.insertAdjacentHTML("beforeend", createExperienceItem(idx, exp)),
    );
  }

  async function submitStep3() {
    const experience = collectExperienceData();
    if (!experience.length || !experience[0].jobTitle)
      return showToast("Add at least one experience", "error");
    try {
      await cvBuild({
        cvId: cvState.id,
        status: "draft",
        cvJson: { experience },
      });
      showToast("Experience saved");
      goToStep(4);
    } catch {
      showToast("Failed to save experience", "error");
    }
  }
  function createExperienceItem(index, data = {}) {
    return `
    <div class="list-item" data-index="${index}">
      <div class="list-header">
        <div class="list-title">Experience #${index + 1}</div>
        <button type="button" class="remove-btn" onclick="removeExperience(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Job Title *</label>
          <input class="form-control experience-title" value="${data.jobTitle || ""}">
        </div>
        <div class="form-group">
          <label>Company *</label>
          <input class="form-control experience-company" value="${data.company || ""}">
        </div>
        <div class="form-group">
          <label>Location</label>
          <input class="form-control experience-location" value="${data.location || ""}">
        </div>
        <div class="form-group">
          <label>Start Date</label>
          <input type="month" class="form-control experience-start-date" value="${data.startDate || ""}">
        </div>
        <div class="form-group">
          <label>End Date</label>
          <input type="month" class="form-control experience-end-date" value="${data.endDate || ""}">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" class="experience-current" ${data.isCurrent ? "checked" : ""}>
            Current
          </label>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-control experience-description">${data.description || ""}</textarea>
        </div>
      </div>
    </div>
  `;
  }

  // ================= STEP 4 =================
  function collectEducationData() {
    const items = document.querySelectorAll("#educationList .list-item");
    return Array.from(items).map((item) => ({
      degree: item.querySelector(".education-degree")?.value || "",
      institution: item.querySelector(".education-institution")?.value || "",
      graduationYear: item.querySelector(".education-date")?.value || "",
    }));
  }

  function createEducationItem(index, data = {}) {
    return `
      <div class="list-item" data-index="${index}">
        <div class="list-header">
          <div class="list-title">Education #${index + 1}</div>
          <button type="button" class="remove-btn" onclick="removeEducation(${index})">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Degree *</label>
            <input class="form-control education-degree" value="${data.degree || ""}">
          </div>
          <div class="form-group">
            <label>Institution *</label>
            <input class="form-control education-institution" value="${data.institution || ""}">
          </div>
          <div class="form-group">
            <label>Graduation Year</label>
            <input type="month" class="form-control education-date" value="${data.graduationYear || ""}">
          </div>
        </div>
      </div>
    `;
  }

  function fillStep4(cv) {
    const list = document.getElementById("educationList");
    if (!list) return;
    list.innerHTML = "";
    const education = cv.sections?.education || [];
    if (!education.length) list.innerHTML = createEducationItem(0);
    education.forEach((edu, idx) =>
      list.insertAdjacentHTML("beforeend", createEducationItem(idx, edu)),
    );
  }

  async function submitStep4() {
    const education = collectEducationData();
    if (!education.length || !education[0].degree)
      return showToast("Add at least one education record", "error");
    try {
      await cvBuild({
        cvId: cvState.id,
        status: "draft",
        cvJson: { education },
      });
      showToast("Education saved");
      goToStep(5);
    } catch {
      showToast("Failed to save education", "error");
    }
  }

  // ================= STEP 5 =================
  function renderSkill(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tag = document.createElement("span");
    tag.className = "skill-tag";
    tag.textContent = value;
    tag.onclick = () => tag.remove();

    container.appendChild(tag);
  }

  // دالة لجمع الـ skills من container معين
  function getSkills(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll(".skill-tag")).map((el) =>
      el.textContent.trim(),
    );
  }
  function fillStep5(cv) {
    const skills = cv.sections?.skills || [];
    if (!skills.length) return;

    // containers
    const techContainer = document.getElementById("technicalSkills");
    const softContainer = document.getElementById("softSkills");
    const langContainer = document.getElementById("languageSkills");

    // clear old
    techContainer.innerHTML = "";
    softContainer.innerHTML = "";
    langContainer.innerHTML = "";

    // توزيع ذكي (اختياري)
    skills.forEach((skill) => {
      const lower = skill.toLowerCase();

      if (
        ["html", "css", "javascript", "react", "vue", "angular", "node"].some(
          (k) => lower.includes(k),
        )
      ) {
        renderSkill("technicalSkills", skill);
      } else if (
        ["english", "arabic", "french", "german"].some((k) => lower.includes(k))
      ) {
        renderSkill("languageSkills", skill);
      } else {
        renderSkill("softSkills", skill);
      }
    });
  }

  // دالة لإضافة skill
  window.addSkill = function (type) {
    let input, container;
    if (type === "technical") {
      input = document.getElementById("techSkillInput");
      container = document.getElementById("technicalSkills");
    } else if (type === "soft") {
      input = document.getElementById("softSkillInput");
      container = document.getElementById("softSkills");
    } else if (type === "language") {
      input = document.getElementById("languageInput");
      container = document.getElementById("languageSkills");
    }

    const value = input.value.trim();
    if (!value) return;

    const tag = document.createElement("span");
    tag.className = "skill-tag";
    tag.textContent = value;
    tag.onclick = () => tag.remove(); // يمكن حذف الـ skill بالضغط عليه
    container.appendChild(tag); // يضاف تحت العناصر الموجودة
    input.value = "";
  };

  // دالة لحفظ Step 5
  async function submitStep5() {
    const technical = getSkills("technicalSkills");
    const soft = getSkills("softSkills");
    const languages = getSkills("languageSkills");

    // Flatten كل الـ skills في Array واحدة
    const skills = [...technical, ...soft, ...languages];

    if (!skills.length) {
      return showToast("Please add at least one skill", "error");
    }

    try {
      await cvBuild({
        cvId: cvState.id,
        status: "completed",
        cvJson: {
          skills, // ✅ string[]
        },
      });

      showToast("Skills saved successfully!");
      goToStep(6);
    } catch (err) {
      console.error(err);
      showToast("Failed to save skills", "error");
    }
  }
  // ================= STEP 6 =================
  function renderStep6Sidebar(cv) {
    // ===== Selected Template =====
    const templateEl = document.getElementById("selectedTemplatePreview");
    if (templateEl) {
      const templateName =
        TEMPLATE_REVERSE_MAP[cv.templateId] || "Not selected yet";

      templateEl.textContent =
        templateName.charAt(0).toUpperCase() + templateName.slice(1);
    }

    // ===== CV Summary =====
    const personalCountEl = document.getElementById("previewPersonalCount");
    const experienceCountEl = document.getElementById("previewExperienceCount");
    const educationCountEl = document.getElementById("previewEducationCount");
    const skillsCountEl = document.getElementById("previewSkillsCount");

    const personalInfo = cv.sections?.personalInfo || {};
    const experience = cv.sections?.experience || [];
    const education = cv.sections?.education || [];
    const skills = cv.sections?.skills || [];

    // عدد الحقول المليانة في personal info
    const personalCount = Object.values(personalInfo).filter(
      (v) => v && v.toString().trim() !== "",
    ).length;

    if (personalCountEl)
      personalCountEl.textContent = `${personalCount} fields`;

    if (experienceCountEl)
      experienceCountEl.textContent = `${experience.length} positions`;

    if (educationCountEl)
      educationCountEl.textContent = `${education.length} entries`;

    if (skillsCountEl) skillsCountEl.textContent = `${skills.length} skills`;
  }

 async function loadStep6Preview() {
   if (!cvState.id) return;

   const previewEl = document.getElementById("cvPreview");
   previewEl.innerHTML = "<p class='text-muted'>Loading preview...</p>";

   try {
     const res = await getCvById(cvState.id);
     const cv = res.data.data;
renderStep6Sidebar(cv);
     if (!cv.lastExport) {
       previewEl.innerHTML =
         "<p class='text-muted'>No preview available yet</p>";
       return;
     }

     // Preview للـ PDF فقط
     if (cv.lastExport.format !== "pdf") {
       previewEl.innerHTML =
         "<p class='text-muted'>Preview available only for PDF. Please download DOCX.</p>";
       return;
     }

     // 🔥 استدعاء stream-file
     const fileRes = await cvPreview(cvState.id);
     const blob = new Blob([fileRes.data], { type: "application/pdf" });
     const fileUrl = URL.createObjectURL(blob);

     previewEl.innerHTML = `
      <iframe
        src="${fileUrl}"
        style="width:100%; height:600px; border:none"
      ></iframe>
    `;
   } catch (err) {
     console.error(err);
     previewEl.innerHTML =
       "<p class='text-muted'>Failed to load CV preview</p>";
     showToast("Failed to load CV preview", "error");
   }
 }

  // ================= DOWNLOAD =================
window.downloadCv = async function (format = "pdf") {
  if (!cvState.id) {
    return showToast("No CV found", "error");
  }

  try {
    const res = await exportCv(cvState.id, format);
console.log(res);
   const fileUrl = res?.data?.data?.filePath;
console.log(fileUrl);

    if (!fileUrl) {
      console.log("Export CV response:", res);
      return showToast("File link not found", "error");
    }

    const a = document.createElement("a");
    a.href = fileUrl;
    a.target = "_blank";
    a.download = fileUrl.split("/").pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error(err);
    showToast("Download failed", "error");
  }
};


  // ================= NAVIGATION =================
  window.previousStep = async function () {
    if (currentStep <= 1) return;
    currentStep--;
    sessionStorage.setItem("cvCurrentStep", currentStep);
    if (cvState.id) {
      const res = await getCvById(cvState.id);
      const cv = res.data.data;
      if (currentStep === 2) fillStep2(cv);
      if (currentStep === 3) fillStep3(cv);
      if (currentStep === 4) fillStep4(cv);
      if (currentStep === 5) fillStep5(cv);
    }
    goToStep(currentStep);
  };

  window.nextStep = function () {
    if (currentStep === 1) return submitStep1();
    if (currentStep === 2) return submitStep2();
    if (currentStep === 3) return submitStep3();
    if (currentStep === 4) return submitStep4();
    if (currentStep === 5) return submitStep5();
  };

  function goToStep(step) {
    document
      .querySelectorAll(".step-content")
      .forEach((el) => el.classList.remove("active"));
    document
      .querySelectorAll(".wizard-step")
      .forEach((el) => el.classList.remove("active"));

    document.getElementById(`step-${step}`)?.classList.add("active");
    document
      .querySelector(`.wizard-step[data-step="${step}"]`)
      ?.classList.add("active");

    currentStep = step;
    sessionStorage.setItem("cvCurrentStep", step);

    // 👇 الجديد فقط
    if (step === 6) {
      loadStep6Preview();
    }
  }

  await restoreCvState();
  goToStep(currentStep);
});
