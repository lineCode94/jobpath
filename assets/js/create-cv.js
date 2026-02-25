import { cvCreate, cvBuild, getCvById, exportCv, cvPreview , getUserDetails} from "./api.js";
import { requireAuth } from "./ats-gard.js";
import syncSessionWithUser from "./syncSessionWithUser.js";
//============GET USER ID ================


document.addEventListener("DOMContentLoaded", async () => {
  await requireAuth();
  await syncSessionWithUser();
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
      position: "center",
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
  // ================= translate function =================
  function t(en, ar) {
    return (localStorage.getItem("lang") || "en") === "ar" ? ar : en;
  }
  

  // ================= RESTORE CV =================
  async function restoreCvState() {
    if (!cvState.id) return;
    try {
      const res = await getCvById(cvState.id);
      const cv = res.data.data;

      // console.log("RESTORE CV:", cv);

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
  if (!cvState.templateId) {
    return showToast("Please select a template first", "error");
  }

  try {
    // لو فيه CV موجود → نعمل update للتمبلت
    if (cvState.id) {
      await cvBuild({
        cvId: cvState.id,
        status: "draft",
        templateId: cvState.templateId,
      });
 

      showToast(t("Template updated", "تم تحديث القالب"));
      return goToStep(2);
    }

    // لو مفيش CV → نعمل واحد جديد
    const res = await cvCreate({
      templateId: cvState.templateId,
      language: cvState.language,
    });

    cvState.id = res.data.data.id;
    sessionStorage.setItem("cvId", cvState.id);
    showToast( t("Template saved", "تم حفظ القالب"));
    goToStep(2);
  } catch (err) {
    console.error(err);
    showToast( t("Failed to save template", "فشل حفظ القالب"), "error");
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
      showToast( t("Personal info saved", "تم حفظ المعلومات الشخصية"));
      goToStep(3);
    } catch {
      showToast( t("Failed to save personal info", "فشل حفظ المعلومات الشخصية"), "error");
    }
  }

  // ================= STEP 3 =================

  function collectExperienceData() {
    const items = document.querySelectorAll("#experienceList .list-item");
    return Array.from(items).map((item) => ({
      jobTitle: item.querySelector(".experience-title")?.value || "",
      company: item.querySelector(".experience-company")?.value || "",
      location: item.querySelector(".experience-location")?.value || "",
      from: item.querySelector(".experience-start-date")?.value
        ? item.querySelector(".experience-start-date").value + "-01"
        : "",
      to: item.querySelector(".experience-end-date")?.value
        ? item.querySelector(".experience-end-date").value + "-01"
        : "",

      isCurrentlyWorking:
        item.querySelector(".experience-current")?.checked || false,
      brief: item.querySelector(".experience-description")?.value || "",
    }));
  }
  // ================= ADD EXPERIENCE BUTTON =================
  const addExperienceBtn = document.querySelector("#step-3 .add-btn");

  if (addExperienceBtn) {
    addExperienceBtn.addEventListener("click", () => {
      const list = document.getElementById("experienceList");
      const items = list.querySelectorAll(".list-item");
      const newIndex = items.length;

      list.insertAdjacentHTML("beforeend", createExperienceItem(newIndex));
    });
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
    const validExperience = experience.filter((e) => e.jobTitle && e.company);

    if (!validExperience.length)
      return showToast( t("Please add at least one experience", "الرجاء إضافة خبرة واحدة على الأقل"), "error");

    try {
      await cvBuild({
        cvId: cvState.id,
        status: "draft",
        cvJson: { experience },
      });
      showToast( t("Experience saved", "تم حفظ الخبرة"));
      goToStep(4);
    } catch {
      showToast( t("Failed to save experience", "فشل حفظ الخبرة"), "error");
    }
  }
function createExperienceItem(index, data = {}) {
  const lang = localStorage.getItem("lang") || "en";

  return `
    <div class="list-item" data-index="${index}" dir="${lang === "ar" ? "rtl" : "ltr"}">
      
      <div class="list-header">
        <div 
          class="list-title"
          data-en="Experience #${index + 1}"
          data-ar="خبرة رقم ${index + 1}"
        >
          ${lang === "ar" ? `خبرة رقم ${index + 1}` : `Experience #${index + 1}`}
        </div>

        <button type="button" class="remove-btn" onclick="removeExperience(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="form-grid">

        <div class="form-group">
          <label data-en="Job Title *" data-ar="المسمى الوظيفي *">
            ${lang === "ar" ? "المسمى الوظيفي *" : "Job Title *"}
          </label>
          <input 
            class="form-control experience-title" 
            value="${data.jobTitle || ""}"
          >
        </div>

        <div class="form-group">
          <label data-en="Company *" data-ar="اسم الشركة *">
            ${lang === "ar" ? "اسم الشركة *" : "Company *"}
          </label>
          <input 
            class="form-control experience-company" 
            value="${data.company || ""}"
          >
        </div>

        <div class="form-group">
          <label data-en="Location" data-ar="الموقع">
            ${lang === "ar" ? "الموقع" : "Location"}
          </label>
          <input 
            class="form-control experience-location" 
            value="${data.location || ""}"
          >
        </div>

        <div class="form-group">
          <label data-en="Start Date" data-ar="تاريخ البداية">
            ${lang === "ar" ? "تاريخ البداية" : "Start Date"}
          </label>
          <input
            type="month"
            class="form-control experience-start-date"
            value="${data.from ? data.from.slice(0, 7) : ""}"
          >
        </div>

        <div class="form-group">
          <label data-en="End Date" data-ar="تاريخ الانتهاء">
            ${lang === "ar" ? "تاريخ الانتهاء" : "End Date"}
          </label>
          <input
            type="month"
            class="form-control experience-end-date"
            value="${data.to ? data.to.slice(0, 7) : ""}"
          >
        </div>

        <div class="form-group">
          <label>
            <input 
              type="checkbox" 
              class="experience-current" 
              ${data.isCurrentlyWorking ? "checked" : ""}
            >
            <span 
              data-en="Currently Working"
              data-ar="أعمل هنا حالياً"
            >
              ${lang === "ar" ? "أعمل هنا حالياً" : "Currently Working"}
            </span>
          </label>
        </div>

        <div class="form-group">
          <label data-en="Description" data-ar="الوصف">
            ${lang === "ar" ? "الوصف" : "Description"}
          </label>
          <textarea 
            class="form-control experience-description"
          >${data.brief || ""}</textarea>
        </div>

      </div>
    </div>
  `;
}

  window.removeExperience = function (index) {
    const list = document.getElementById("experienceList");
    const items = list.querySelectorAll(".list-item");

    if (items[index]) {
      items[index].remove();
    }
  };

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
  const lang = localStorage.getItem("lang") || "en";

  return `
    <div class="list-item" data-index="${index}" dir="${lang === "ar" ? "rtl" : "ltr"}">
      
      <div class="list-header">
        <div 
          class="list-title"
          data-en="Education #${index + 1}"
          data-ar="تعليم رقم ${index + 1}"
        >
          ${lang === "ar" ? `تعليم رقم ${index + 1}` : `Education #${index + 1}`}
        </div>

        <button type="button" class="remove-btn" onclick="removeEducation(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="form-grid">

        <div class="form-group">
          <label 
            data-en="Degree *"
            data-ar="الدرجة العلمية *"
          >
            ${lang === "ar" ? "الدرجة العلمية *" : "Degree *"}
          </label>
          <input 
            class="form-control education-degree" 
            value="${data.degree || ""}"
          >
        </div>

        <div class="form-group">
          <label 
            data-en="Institution *"
            data-ar="المؤسسة التعليمية *"
          >
            ${lang === "ar" ? "المؤسسة التعليمية *" : "Institution *"}
          </label>
          <input 
            class="form-control education-institution" 
            value="${data.institution || ""}"
          >
        </div>

        <div class="form-group">
          <label 
            data-en="Graduation Date"
            data-ar="تاريخ التخرج"
          >
            ${lang === "ar" ? "تاريخ التخرج" : "Graduation Date"}
          </label>
          <input 
            type="month" 
            class="form-control education-date" 
            value="${data.graduationYear ? data.graduationYear.slice(0, 7) : ""}"
          >
        </div>

      </div>
    </div>
  `;
}

window.removeEducation = function (index) {
  const list = document.getElementById("educationList");
  const items = list.querySelectorAll(".list-item");

  if (items[index]) {
    items[index].remove();
  }
};

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
  // ================= ADD EDUCATION BUTTON =================
  const addEducationBtn = document.querySelector("#step-4 .add-btn");

  if (addEducationBtn) {
    addEducationBtn.addEventListener("click", () => {
      const list = document.getElementById("educationList");
      const items = list.querySelectorAll(".list-item");
      const newIndex = items.length;

      list.insertAdjacentHTML("beforeend", createEducationItem(newIndex));
    });
  }

  async function submitStep4() {
    const education = collectEducationData();
    if (!education.length || !education[0].degree)
      return showToast( t("Please add at least one education", "الرجاء إضافة تعليم واحد على الأقل"), "error");
    try {
      await cvBuild({
        cvId: cvState.id,
        status: "draft",
        cvJson: { education },
      });
      showToast( t("Education saved", "تم حفظ التعليم"));
      goToStep(5);
    } catch {
      showToast( t("Failed to save education", "فشل حفظ التعليم"), "error");
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
      return showToast( t("Please add at least one skill", "الرجاء إضافة واحدة على الأقل"), "error");
    }

    try {
      await cvBuild({
        cvId: cvState.id,
        status: "completed",
        cvJson: {
          skills, // ✅ string[]
        },
      });

      showToast( t("Skills saved", "تم حفظ المهارات"));
      goToStep(6);
    } catch (err) {
      console.error(err);
      showToast( t("Failed to save skills", "فشل حفظ المهارات"), "error");
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
      showToast( t("Failed to load CV preview", "فشل تحميل معاينة السيرة الذاتية"), "error");
    }
  }

  // ================= DOWNLOAD =================
  window.downloadCv = async function (format = "pdf") {
    if (!cvState.id) {
      return showToast(t("No cv to download", "لا يوجد سيرة معاينة للتنزيل"), "error");
    }

    try {
      const res = await exportCv(cvState.id, format);
      // console.log(res);
      const fileUrl = res?.data?.data?.filePath;
      // console.log(fileUrl);

      if (!fileUrl) {
        // console.log("Export CV response:", res);
        return showToast(t("Failed to download CV", "فشل التنزيل"), "error");
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
      showToast(t("Failed to download CV", "فشل التنزيل"), "error");
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
