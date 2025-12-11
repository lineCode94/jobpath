import {
  updateProfile,
  setAuthToken,
  getUserDetails,
  uploadCv,
  getAllCourses,
  getJobNames,
  getUserReports,
  getCvMeta,
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

  // ---------------- DOM elements ----------------
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("emailUser");
  const phoneInput = document.getElementById("phoneUser");
  const jobInput = document.getElementById("job");
  const citySelect = document.getElementById("City");
  const oldPasswordInput = document.getElementById("oldPassword");
  const passwordInput = document.getElementById("passwordUser");
  const passwordLabel = document.querySelector("#password-wrapper label");

  // CV elements (from your HTML)
  const cvForm = document.getElementById("cvForm");
  const cvInput = document.getElementById("cv");
  const cvDownloadDiv = document.getElementById("cvDownloadDiv");
  const cvUploadingDiv = document.getElementById("cvUploadingDiv");
  const cvPreviewDiv = document.getElementById("cvPreviewDiv");

  // small area to show filename + timestamp (we'll inject it into cvPreviewDiv)
  // showToast helper
function showToast(message, type = "info") {
  const styles = {
    success: {
      icon: '<i class="fa-solid fa-circle-check"></i>',
      bg: "linear-gradient(135deg, #28a745, #6fdc8d)",
    },
    error: {
      icon: '<i class="fa-solid fa-circle-xmark"></i>',
      bg: "linear-gradient(135deg, #dc3545, #ff6b81)",
    },
    warning: {
      icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
      bg: "linear-gradient(135deg, #ffc107, #ffd861)",
    },
    info: {
      icon: '<i class="fa-solid fa-circle-info"></i>',
      bg: "linear-gradient(135deg, #007bff, #6bb6ff)",
    },
  };

  Toastify({
    text: `${styles[type].icon} <span style="margin-left:8px">${message}</span>`,
    duration: 3500,
    gravity: "bottom", // يظهر تحت
    position: "left", // شمال
    close: true,
    escapeMarkup: false, // 👈 مهم عشان يسمح بعرض HTML داخل التوست
    offset: { x: 20, y: 20 },
    style: {
      background: styles[type].bg,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "15px",
      fontWeight: "600",
      borderRadius: "10px",
      padding: "12px 18px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  }).showToast();
}

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

  // ---------------- secure download (returns file to user) ----------------
  async function secureDownload(url, suggestedName = "cv.pdf") {
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
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      showToast("⚠️ حدث خطأ أثناء تحميل السيرة الذاتية", "error");
    }
  }

  // ---------------- helpers: filename / date formatting ----------------
  function filenameFromPath(path) {
    
    if (!path) return "";
    try {
      const u = new URL(path);
      return decodeURIComponent(u.pathname.split("/").pop());
    } catch {
      // fallback if not a full URL
      const parts = path.split("/").pop();
      return parts;
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      // format like in image: HH:mm YYYY-MM-DD (you can adjust)
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mmth = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${hh}:${mm} ${yyyy}-${mmth}-${dd}`;
    } catch {
      return iso;
    }
  }

  // ---------------- render CV UI (download / preview / meta) ----------------
 function renderCvUI(cvPath = null, meta = {}) {
  console.log("meta render cv",meta)
   if (!cvDownloadDiv || !cvUploadingDiv || !cvPreviewDiv) return;

   cvDownloadDiv.innerHTML = "";
   cvUploadingDiv.innerHTML = "";
   cvPreviewDiv.innerHTML = "";

   // -----------------------
   // Align buttons to the right
   // -----------------------
   cvDownloadDiv.style.display = "flex";
   cvDownloadDiv.style.justifyContent = "flex-end";
   cvDownloadDiv.style.gap = "10px";

   // -----------------------
   // Helpers
   // -----------------------
   const arabicMonths = {
     يناير: "January",
     فبراير: "February",
     مارس: "March",
     أبريل: "April",
     ابريل: "April",
     مايو: "May",
     يونيو: "June",
     يوليو: "July",
     أغسطس: "August",
     اغسطس: "August",
     سبتمبر: "September",
     أكتوبر: "October",
     اكتوبر: "October",
     نوفمبر: "November",
     ديسمبر: "December",
   };

   const arabicToEnglishDigits = (str) =>
     str.replace(/[٠-٩]/g, (d) => "0123456789"[d.charCodeAt(0) - 0x0660]);

   const normalizeArabicDate = (dateStr) => {
     let s = arabicToEnglishDigits(dateStr.trim());

     // استبدال الشهر العربي بالشهر الإنجليزي
     for (const [ar, en] of Object.entries(arabicMonths)) {
       const regex = new RegExp(ar, "g");
       s = s.replace(regex, en);
     }

     return s;
   };

   const formatDate = (dateStr) => {
     if (!dateStr) return currentLang === "ar" ? "تاريخ غير متاح" : "No date";

     const normalized = normalizeArabicDate(dateStr);
     const d = new Date(normalized);

     if (isNaN(d)) return currentLang === "ar" ? "تاريخ غير متاح" : "No date";

     return d.toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US", {
       day: "numeric",
       month: "long",
       year: "numeric",
     });
   };

   // -----------------------
   // Build final filename safely
   // -----------------------
   const user = meta?.username || "cv";
   console.log("user",user)
   const ext = meta?.fileExtension || ".pdf";
   const finalFileName = `${user}${ext}`;

   console.log("finalFileName:", finalFileName);

   const finalDateFormatted = formatDate(meta?.date);
console.log(finalDateFormatted);

   // -----------------------
   // Download button
   // -----------------------
   const downloadBtn = document.createElement("button");
   downloadBtn.type = "button";
   downloadBtn.className = "rts__btn fill__btn";
   downloadBtn.style.cssText =
     "border-radius:50%;padding:10px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;";
   downloadBtn.innerHTML = `<i class="fa-solid fa-download"></i>`;

   if (!cvPath) {
     downloadBtn.disabled = true;
     downloadBtn.title = currentLang === "ar" ? "لا يوجد سيرة ذاتية" : "No CV";
     downloadBtn.style.opacity = "0.45";
   } else {
     downloadBtn.title =
       currentLang === "ar" ? "تحميل السيرة الذاتية" : "Download CV";
     downloadBtn.addEventListener("click", () => {
      //  alert(finalFileName);
       secureDownload(cvPath, finalFileName);
     });
   }

   cvDownloadDiv.appendChild(downloadBtn);

   // -----------------------
   // Preview button
   // -----------------------
   const previewBtn = document.createElement("button");
   previewBtn.type = "button";
   previewBtn.className = "rts__btn fill__btn";
   previewBtn.style.cssText =
     "border-radius:50%;padding:10px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;";
   previewBtn.innerHTML = `<i class="fa-solid fa-eye"></i>`;

   if (!cvPath) {
     previewBtn.disabled = true;
     previewBtn.style.opacity = "0.45";
     previewBtn.title = currentLang === "ar" ? "لا يوجد معاينة" : "No preview";
   } else {
     previewBtn.title =
       currentLang === "ar" ? "معاينة السيرة الذاتية" : "Preview CV";
     previewBtn.addEventListener("click", async () => {
       try {
         const token = localStorage.getItem("authToken");
         const res = await fetch(cvPath, {
           method: "GET",
           headers: { Authorization: `Bearer ${token}` },
         });
         if (!res.ok) {
           showToast("⚠️ فشل جلب الملف للمعاينة", "error");
           return;
         }
         const blob = await res.blob();
         const url = URL.createObjectURL(blob);
         window.open(url, "_blank");
       } catch (err) {
         console.error(err);
         showToast("⚠️ خطأ أثناء المعاينة", "error");
       }
     });
   }

   cvDownloadDiv.appendChild(previewBtn);

   // -----------------------
   // Meta display
   // -----------------------
   const metaWrap = document.createElement("div");
   metaWrap.classList.add("meta-text");

   const fileNameText = document.createElement("div");
   fileNameText.style.cssText =
     "font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
   fileNameText.textContent = finalFileName;

   const dateText = document.createElement("div");
   dateText.style.cssText = "font-size:12px;color:#6b6b6b;";
   dateText.textContent =
     (currentLang === "ar" ? "تم الرفع في: " : "Uploaded at: ") +
     finalDateFormatted;

   metaWrap.appendChild(fileNameText);
   metaWrap.appendChild(dateText);

   cvPreviewDiv.appendChild(metaWrap);
 }





  // ---------------- Auto upload on file select ----------------
  async function handleAutoUpload(file) {
    if (!file) return;
    // allowed types (PDF, DOCX). Add more if backend accepts.
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    // small size check (example 6MB) — your backend said 5MB max, adjust message accordingly
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast("⚠️ حجم الملف أكبر من المسموح (5MB).", "warning");
      return;
    }

    if (!allowed.includes(file.type)) {
      // not a strict check: some files might have different mime (e.g., pdf with wrong header),
      // but this helps catch obvious wrong types.
      showToast("⚠️ امتداد الملف غير مدعوم. استخدم PDF أو DOCX.", "warning");
      return;
    }

    // show spinner while uploading
    cvUploadingDiv.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
      <span class="spinner-border" role="status" aria-hidden="true" style="width:20px;height:20px;"></span>
      <span style="font-size:14px;">${
        currentLang === "ar" ? "جاري الرفع..." : "Uploading..."
      }</span>
    </div>`;

    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await uploadCv(formData); // uploadCv comes from api.js and expects FormData

      // expected: res.data.urlInfo.downloadUrl or backend may return updated user
      // handle both possibilities
      const downloadUrl =
        res?.data?.urlInfo?.downloadUrl ||
        res?.data?.cvPath ||
        res?.data?.path ||
        null;
      const msg =
        res?.data?.msg ||
        (currentLang === "ar"
          ? "تم رفع السيرة الذاتية بنجاح!"
          : "CV uploaded successfully!");

     if (downloadUrl) {
       // بعد الرفع
       try {
         // 1) جيب الميتاداتا الحقيقي من الاندبوينت
         const metaData = await getCvMeta();
         const meta = metaData?.metadata || {};

         // 2) اعمل render بناء على البيانات الصح اللي من الباك
         renderCvUI(downloadUrl, meta);

         showToast(`  ${msg}`, "success");
         window.location.reload();
       } catch (err) {
         console.error(err);
         showToast("⚠️ فشل جلب بيانات الملف بعد الرفع", "error");
       }
     } else {
       // fallback لو السيرفر رجعش لينك
       try {
         const refreshed = await getCvMeta();
         const meta = refreshed?.metadata || {};

         const newCv = refreshed?.metadata?.downloadUrl || null;

         renderCvUI(newCv, meta);
         showToast(`  ${msg}`, "success");
       } catch {
         renderCvUI(null, {});
         showToast(`  ${msg}`, "success");
       }
     }

    } catch (err) {
      console.error("Upload error:", err);
      const errMsg =
        err?.response?.data?.msg ||
        err?.message ||
        (currentLang === "ar" ? "حدث خطأ أثناء الرفع" : "Upload error");
      showToast(`  ${errMsg}`, "error");
      renderCvUI(null, {});
    } finally {
      // clear uploading indicator
      cvUploadingDiv.innerHTML = "";
      // reset input so same file can be selected again if needed
      if (cvInput) cvInput.value = "";
    }
  }

  // attach change handler to input (auto upload)
  if (cvInput) {
    cvInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleAutoUpload(file);
      }
    });
  }

  // ---------------- FETCH USER & INITIALIZE CV UI ----------------
  const token = localStorage.getItem("authToken");
  let user = null;
  if (token) {
    setAuthToken(token);
    try {
      const response = await getUserDetails();
      console.log(response)
 const metaData = await getCvMeta();
 const date = metaData.data.metadata.date;
 const correctDate = new Date(date);
 const theLang = localStorage.getItem("lang") || "en";
 const formattedDate =
   theLang === "ar"
     ? correctDate.toLocaleDateString("ar-EG", {
         day: "numeric",
         month: "long",
         year: "numeric",
       })
     : correctDate.toLocaleDateString("en-US", {
         day: "numeric",
         month: "long",
         year: "numeric",
       });
//  const fileExtension = metaData.data.metadata.fileExtension;


 console.log(metaData.data.metadata);
      user = response?.data?.currentUser || null;
  const res = await getAllCourses();
      const jobsNamesRes = await getJobNames();
      const jobNames = jobsNamesRes.data.jobNames;

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
      // fill profile fields
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
           const reportsContainer = document.getElementById("reports");
           if (reportsContainer) {
             try {
               const reportRes = await getUserReports();
               if (reportRes.status && reportRes.last_report) {
                 reportsContainer.innerHTML = `
                <div class="p-3 text-center">
                  <a href="${reportRes.last_report}" target="_blank" class="btn btn-primary">
                    <i class="fa-solid fa-download me-2"></i>
                    <span data-en="Download Job Report" data-ar="تحميل تقرير الوظائف">
                      Download Job Report
                    </span>
                  </a>
                </div>`;
               } else {
                 reportsContainer.innerHTML = `
                <div class="p-3 text-center text-muted">
                  <i class="fa-regular fa-file me-2"></i>
                  <span data-en="No job reports found" data-ar="لا توجد تقارير وظائف">
                    No job reports found
                  </span>
                </div>`;
               }
             } catch (err) {
               console.error("Error fetching user reports:", err);
             }
           }
      }

      // initial render CV section
      const initCvPath = user?.cvPath || null;
      const meta = {
        username: metaData.data.metadata.username,
        fileExtension: metaData.data.metadata.fileExtension,
        date: formattedDate,
      };
      renderCvUI(initCvPath, meta);
    } catch (err) {
      console.error("Error fetching user details:", err);
      // still render empty UI
      renderCvUI(null, {});
    }
  } else {
    // not logged in → render disabled UI
    renderCvUI(null, {});
  }

  // ---------------- PROFILE FORM SUBMISSION ----------------
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
        showToast("  تم حفظ البيانات بنجاح!", "success");

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

  // ---------------- SOCIAL LINKS FORM ----------------
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
        showToast("  تم حفظ روابط التواصل بنجاح!", "success");
      } catch (err) {
        console.error(err);
        showToast(
          `  فشل حفظ الروابط: ${err.response?.data?.msg || err.message}`,
          "error"
        );
      }
    });
  }
});
