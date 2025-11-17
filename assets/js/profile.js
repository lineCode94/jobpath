import {
  updateProfile,
  setAuthToken,
  getUserDetails,
  uploadCv,
  getAllCourses,
  getJobNames,
  getUserReports,
} from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const socialForm = document.getElementById("socialForm");
  const form = document.getElementById("profileForm");

  const currentLang = localStorage.getItem("lang") || "en";
  const translations = {
    en: {
      updatePassword: "Update Password",
      createPassword: "Create Password",
    },
    ar: {
      updatePassword: "تحديث كلمة المرور",
      createPassword: "إنشاء كلمة مرور",
    },
  };

  // DOM elements
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("emailUser");
  const phoneInput = document.getElementById("phoneUser");
  const jobInput = document.getElementById("job");
  const citySelect = document.getElementById("City");
  const oldPasswordInput = document.getElementById("oldPassword");
  const passwordInput = document.getElementById("passwordUser");
  const passwordLabel = document.querySelector("#password-wrapper label");

  // CV elements
  const cvForm = document.getElementById("cvForm");
  const cvInput = document.getElementById("cv");
  const cvDownloadDiv = document.getElementById("cvDownloadDiv");
  const cvUploadingDiv = document.getElementById("cvUploadingDiv");
  const cvPreviewDiv = document.getElementById("cvPreviewDiv");

  const showToast = (msg, type = "info") => {
    Toastify({
      text: msg,
      duration: 3000,
      gravity: "top",
      position: "center",
      style: {
        background:
          type === "success"
            ? "linear-gradient(to right, #00b09b, #96c93d)"
            : type === "error"
            ? "linear-gradient(to right, #e52d27, #b31217)"
            : type === "warning"
            ? "linear-gradient(to right, #f7971e, #ffd200)"
            : "linear-gradient(to right, #283c86, #45a247)",
        color: "#fff",
        fontSize: "14px",
        borderRadius: "8px",
        padding: "10px 20px",
      },
    }).showToast();
  };

  const saudiCities = [
    { id: 9429, name: "Riyadh" },
    { id: 9430, name: "Jeddah" },
    { id: 9431, name: "Dammam" },
    { id: 9432, name: "Mecca" },
    { id: 9433, name: "Medina" },
    { id: 9434, name: "Khobar" },
    { id: 9435, name: "Abha" },
  ];

  const jobs = [
    { id: 1, title: "Software engineer" },
    { id: 2, title: "Back end developer" },
    { id: 3, title: "Front end developer" },
  ];

  function populateSelect(
    selectEl,
    items,
    selectedId,
    valueKey = "id",
    textKey = "name"
  ) {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">اختر</option>`;
    items.forEach((it) => {
      const opt = document.createElement("option");
      opt.value = String(it[valueKey]);
      opt.textContent = it[textKey];
      selectEl.appendChild(opt);
    });
    if (selectedId != null) {
      const target = String(selectedId);
      if (Array.from(selectEl.options).some((o) => o.value === target)) {
        selectEl.value = target;
      }
    }
  }

  // --------- SECURE CV DOWNLOAD ----------
  async function secureDownload(url) {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        showToast("⚠️ فشل تحميل السيرة الذاتية", "error");
        return;
      }
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "cv.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      showToast("⚠️ حدث خطأ أثناء تحميل السيرة الذاتية", "error");
    }
  }

  // --------- FETCH USER DETAILS ----------
  const token = localStorage.getItem("authToken");
  let user = null;

  if (token) {
    setAuthToken(token);
    try {
      const response = await getUserDetails();
      const jobsNamesRes = await getJobNames();
      const jobNames = jobsNamesRes.data.jobNames;
      const res = await getAllCourses();
      const suggestedCourses = res.data.courses;

      const suggestedCoursesList = document.getElementById("suggestedCourses");
      const jobNamesList = document.getElementById("jobNames");
      suggestedCoursesList.innerHTML = "";
      jobNamesList.innerHTML = "";

      const lang = localStorage.getItem("lang") || "en";

      suggestedCourses.forEach((course) => {
        const courseName = lang === "ar" ? course.ar_name : course.en_name;
        suggestedCoursesList.innerHTML += `<li><a href="${course.url}" target="_blank">${courseName}</a></li>`;
      });

      jobNames.forEach((name) => {
        const jobname = lang === "ar" ? name.ar_name : name.en_name;
        jobNamesList.innerHTML += `<li>${jobname}</li>`;
      });

      user = response.data?.currentUser;

      if (user) {
        if (user.havePassword !== undefined && passwordInput && passwordLabel) {
          if (user.havePassword) {
            passwordLabel.innerText = translations[currentLang].updatePassword;
            passwordInput.placeholder =
              translations[currentLang].updatePassword;
          } else {
            passwordLabel.innerText = translations[currentLang].createPassword;
            passwordInput.placeholder =
              translations[currentLang].createPassword;
          }
        }

        if (user.fullName) nameInput.value = user.fullName;
        if (user.email) emailInput.value = user.email;
        if (user.phone) phoneInput.value = user.phone;

        if (user.facebook)
          document.getElementById("Facebook").value = user.facebook;
        if (user.linkedin)
          document.getElementById("Linkedin").value = user.linkedin;
        if (user.instagram)
          document.getElementById("Instagram").value = user.instagram;
        if (user.twitter)
          document.getElementById("Twitter").value = user.twitter;
        if (user.portfolio)
          document.getElementById("Portfolio").value = user.portfolio;

        populateSelect(citySelect, saudiCities, user.cityId, "id", "name");
        populateSelect(jobInput, jobs, user.jobId, "id", "title");

        // --------- RENDER CV BUTTONS ----------
        renderCvButtons(user.cvPath || null);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  }

  // --------- RENDER CV BUTTONS FUNCTION ----------
  function renderCvButtons(cvPath = null) {
    if (!cvDownloadDiv || !cvUploadingDiv || !cvPreviewDiv) return;

    cvDownloadDiv.innerHTML = `
      <button id="downloadCvBtn" class="rts__btn fill__btn w-100" ${
        !cvPath ? "disabled" : ""
      } style="border-radius:8px;padding:12px 0;font-size:16px;font-weight:600;background:#28a745;color:#fff;border:none;display:flex;justify-content:center;align-items:center;gap:8px;cursor:pointer;">
        <i class="fa-solid fa-download"></i>    
      </button>
    `;

    cvUploadingDiv.innerHTML = `
      <button id="uploadCvBtn" type="submit" class="rts__btn fill__btn w-100" style="border-radius:8px;padding:12px 0;font-size:16px;font-weight:600;background:#4a6cf7;color:#fff;border:none;display:flex;justify-content:center;align-items:center;gap:8px;cursor:pointer;">
        <i class="fa-solid fa-upload"></i>    
      </button>
    `;

    cvPreviewDiv.innerHTML = `
      <button id="previewCvBtn" class="rts__btn fill__btn w-100  " style="border-radius:8px;padding:12px 0;font-size:16px;font-weight:600;background:#17a2b8;color:#fff;border:none;display:flex;justify-content:center;align-items:center;gap:8px;cursor:pointer;">
        <i class="fa-solid fa-eye"></i>    
      </button>
    `;

    const downloadBtn = document.getElementById("downloadCvBtn");
    if (cvPath && downloadBtn) {
      downloadBtn.addEventListener("click", () => secureDownload(cvPath));
    }

    const previewBtn = document.getElementById("previewCvBtn");
    if (previewBtn) {
      previewBtn.addEventListener("click", async () => {
        try {
          const token = localStorage.getItem("authToken");
          const res = await fetch(
            `https://api.jobzai.net/api/v1/users/get-user-cv`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!res.ok) throw new Error("Failed to fetch CV file");
          const blob = await res.blob();
          const fileURL = URL.createObjectURL(blob);
          window.open(fileURL, "_blank");
        } catch (err) {
          console.error(err);
          showToast("⚠️ خطأ أثناء معاينة السيرة الذاتية", "error");
        }
      });
    }
  }

  // --------- CV FORM SUBMIT ----------
  if (cvForm) {
    cvForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token) return showToast("⚠️ لم يتم تسجيل الدخول.", "warning");

      const clickedBtn = e.submitter; // الزر اللي ضغط عليه
      if (clickedBtn.id === "uploadCvBtn") {
        if (!cvInput.files?.length)
          return showToast("⚠️ اختر ملف السيرة الذاتية أولًا.", "warning");

        try {
          const formData = new FormData();
          formData.append("cv", cvInput.files[0]);
          const cvRes = await uploadCv(formData);
          const downloadUrl = cvRes?.data?.urlInfo?.downloadUrl;
          const msg = cvRes?.data?.msg || "تم رفع السيرة الذاتية بنجاح!";
          if (downloadUrl) renderCvButtons(downloadUrl);
          showToast(`✅ ${msg}`, "success");
        } catch (err) {
          console.error("Upload error:", err);
          showToast(
            `⚠️ حدث خطأ أثناء رفع السيرة الذاتية: ${
              err?.response?.data?.msg || err?.message
            }`,
            "error"
          );
        }
      }
    });
  }

  // --------- UPDATE PROFILE FORM ----------
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token) return showToast("⚠️ لم يتم تسجيل الدخول.", "warning");

      try {
        const payload = {};
        if (nameInput.value.trim()) payload.name = nameInput.value.trim();
        if (emailInput.value.trim()) payload.email = emailInput.value.trim();
        if (phoneInput.value.trim()) payload.phone = phoneInput.value.trim();
        if (citySelect.value) payload.cityId = parseInt(citySelect.value, 10);
        if (jobInput.value) payload.jobId = parseInt(jobInput.value, 10);
        if (passwordInput.value.trim()) {
          payload.newPassword = passwordInput.value.trim();
          if (oldPasswordInput.value.trim())
            payload.oldPassword = oldPasswordInput.value.trim();
        }
        const res = await updateProfile(payload, false);
        showToast("✅ تم حفظ البيانات بنجاح!", "success");

        if (res.data?.isPhoneChanged) {
          localStorage.removeItem("authToken");
          window.location.href = "/index.html";
        }
      } catch (err) {
        console.error(err);
        showToast(
          `⚠️ فشل حفظ البيانات: ${err.response?.data?.msg || err.message}`,
          "error"
        );
      }
    });
  }

  // --------- SOCIAL LINKS FORM ----------
  if (socialForm) {
    socialForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token) return showToast("⚠️ لم يتم تسجيل الدخول.", "warning");

      try {
        const payload = {
          facebook: document.getElementById("Facebook").value.trim() || null,
          linkedin: document.getElementById("Linkedin").value.trim() || null,
          instagram: document.getElementById("Instagram").value.trim() || null,
          twitter: document.getElementById("Twitter").value.trim() || null,
          portfolio: document.getElementById("Portfolio").value.trim() || null,
        };
        await updateProfile(payload, false);
        showToast("✅ تم حفظ روابط التواصل بنجاح!", "success");
      } catch (err) {
        console.error(err);
        showToast(
          `⚠️ فشل حفظ الروابط: ${err.response?.data?.msg || err.message}`,
          "error"
        );
      }
    });
  }
});
