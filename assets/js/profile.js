import {
  updateProfile,
  setAuthToken,
  getUserDetails,
  uploadCv,
  getAllCourses,
  getJobNames,
} from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  // const suggestedCourses = document.getElementById("suggestedCourses");
  // alert("suggestedCourses", suggestedCourses);
  const socialForm = document.getElementById("socialForm");
  // اللغة
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

  // عناصر الفورم الأساسية
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const jobInput = document.getElementById("job");
  const citySelect = document.getElementById("City");
  const cvInput = document.getElementById("cv");
  const form = document.getElementById("profileForm");
  const oldPasswordInput = document.getElementById("oldPassword");
  const passwordInput = document.getElementById("password");
  const passwordLabel = document.querySelector("#password-wrapper label");

  // Toast helper
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

  // Mock data
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

  // user
  const token = localStorage.getItem("authToken");
  let userId = null;
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

      // هات اللغة من localStorage
      const lang = localStorage.getItem("lang") || "en";

      suggestedCourses.forEach((course) => {
        // لو اللغة عربي اعرض ar_name غير كدا اعرض en_name
        const courseName = lang === "ar" ? course.ar_name : course.en_name;

        suggestedCoursesList.innerHTML += `
    <li>
      <a href="${course.url}" target="_blank">${courseName}</a>
    </li>
  `;
      });
      jobNames.forEach((name) => {
        // لو اللغة عربي اعرض ar_name غير كدا اعرض en_name
        const jobname = lang === "ar" ? name.ar_name : name.en_name;

        jobNamesList.innerHTML += `
    <li>
    ${jobname}
    </li>
  `;
      });
      // console.log("courses", res);
      user = response.data?.currentUser;
      // console.log(user);
      if (user) {
        userId = user.id ?? null;

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

        if (user.cvPath) {
          const cvPreview = document.getElementById("cvPreview");
          if (cvPreview) {
            const fileName = user.cvPath.split("/").pop();
            cvPreview.innerHTML = `<a class="cv-link" href="${user.cvPath}" target="_blank"><i class="fa-solid fa-file-pdf"></i> ${fileName}</a>`;
          }
        }

        populateSelect(citySelect, saudiCities, user.cityId, "id", "name");
        populateSelect(jobInput, jobs, user.jobId, "id", "title");
      }
    } catch (err) {
      console.error("error fetching user details:", err);
    }
  }

  // حفظ البيانات الأساسية
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token) {
        showToast("⚠️ لم يتم تسجيل الدخول. برجاء التحقق.", "warning");
        return;
      }
      try {
        if (cvInput && cvInput.files.length > 0 && userId) {
          const cvFormData = new FormData();
          cvFormData.append("cv", cvInput.files[0]);
          const cvRes = await uploadCv( cvFormData);
          if (cvRes.data?.cvPath) {
            const cvPreview = document.getElementById("cvPreview");
            if (cvPreview) {
              cvPreview.innerHTML = `<a href="${cvRes.data.cvPath}" target="_blank">📄 ${cvInput.files[0].name}</a>`;
            }
          }
        }

        const payload = {};
        if (nameInput.value.trim()) payload.name = nameInput.value.trim();
        if (emailInput.value.trim()) payload.email = emailInput.value.trim();
        if (phoneInput.value.trim()) payload.phone = phoneInput.value.trim();
        if (citySelect.value) payload.cityId = parseInt(citySelect.value, 10);
        if (jobInput.value) payload.jobId = parseInt(jobInput.value, 10);
        if (passwordInput && passwordInput.value.trim()) {
          payload.newPassword = passwordInput.value.trim();
          if (oldPasswordInput?.value.trim())
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
      if (!token) {
        showToast("⚠️ لم يتم تسجيل الدخول. برجاء التحقق.", "warning");
        return;
      }
      try {
        const payload = {
          facebook: document.getElementById("Facebook").value.trim() || null,
          linkedin: document.getElementById("Linkedin").value.trim() || null,
          instagram: document.getElementById("Instagram").value.trim() || null,
          twitter: document.getElementById("Twitter").value.trim() || null,
          portfolio: document.getElementById("Portfolio").value.trim() || null,
        };

        const res = await updateProfile(payload, false);
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
