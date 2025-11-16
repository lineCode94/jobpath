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

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("emailUser");
  const phoneInput = document.getElementById("phoneUser");
  const jobInput = document.getElementById("job");
  const citySelect = document.getElementById("City");
  const form = document.getElementById("profileForm");
  const oldPasswordInput = document.getElementById("oldPassword");
  const passwordInput = document.getElementById("passwordUser");
  const passwordLabel = document.querySelector("#password-wrapper label");

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
      jobNamesList.innerHTML = "";
      suggestedCoursesList.innerHTML = "";

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
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  }

  // حفظ البيانات الأساسية
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

  // حفظ السوشيال لينكس
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

  // رفع السيرة الذاتية مع تحميل آمن
  const cvForm = document.getElementById("cvForm");
  const cvInputNew = document.getElementById("cv");
  const cvPreview = document.getElementById("cvPreview");

  if (cvForm) {
    cvForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token) return showToast("⚠️ لم يتم تسجيل الدخول.", "warning");
      if (!cvInputNew.files?.length)
        return showToast("⚠️ اختر ملف السيرة الذاتية أولًا.", "warning");

      try {
        const cvFormData = new FormData();
        cvFormData.append("cv", cvInputNew.files[0]);

        const cvRes = await uploadCv(cvFormData);
        const downloadUrl = cvRes?.data?.urlInfo?.downloadUrl; // استخدام downloadUrl مباشرة
        const msg = cvRes?.data?.msg || "تم رفع السيرة الذاتية بنجاح!";

        if (downloadUrl) {
          cvPreview.innerHTML = `
            <div style="margin-top: 8px; text-align: left;">
              <a href="#" id="downloadCVBtn" class="text-primary fw-semibold">
                <i class="fa-solid fa-download me-1"></i> Download CV
              </a>
            </div>`;

          document
            .getElementById("downloadCVBtn")
            .addEventListener("click", async (e) => {
              e.preventDefault();
              try {
                const token = localStorage.getItem("authToken");
                const res = await fetch(downloadUrl, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                });

                if (!res.ok) throw new Error("Unauthorized or file not found");

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = cvInputNew.files[0].name;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error("Download failed:", err);
                showToast("⚠️ لا يمكنك تحميل الملف الآن.", "error");
              }
            });

          showToast(`✅ ${msg}`, "success");
        } else {
          showToast("⚠️ فشل رفع السيرة الذاتية، حاول مجددًا.", "error");
        }
      } catch (err) {
        console.error("Upload error:", err);
        showToast(
          `⚠️ حدث خطأ أثناء رفع السيرة الذاتية: ${
            err?.response?.data?.msg || err?.message || "حدث خطأ غير متوقع"
          }`,
          "error"
        );
      }
    });
  }
});
