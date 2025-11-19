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
    // clear
    if (!cvDownloadDiv || !cvUploadingDiv || !cvPreviewDiv) return;
    cvDownloadDiv.innerHTML = "";
    cvUploadingDiv.innerHTML = "";
    cvPreviewDiv.innerHTML = "";

    // Download button (circle icon) — enabled only when cvPath exists
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
        // suggest filename from path or meta.filename
        const suggestedName =
          meta.filename || filenameFromPath(cvPath) || "cv.pdf";
        secureDownload(cvPath, suggestedName);
      });
    }
    cvDownloadDiv.appendChild(downloadBtn);

    // Preview button (circle icon)
    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "rts__btn fill__btn";
    previewBtn.style.cssText =
      "border-radius:50%;padding:10px;width:40px;height:40px;display:flex;align-items:center;justify-content:center; ";
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
          // fetch via token and open blob in new tab
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
          // note: we don't revoke immediately so new tab can load; browser will clear later.
        } catch (err) {
          console.error(err);
          showToast("⚠️ خطأ أثناء المعاينة", "error");
        }
      });
    }
    cvPreviewDiv.appendChild(previewBtn);

    // Meta area (filename + updatedAt) — show as small pill
    const metaWrap = document.createElement("div");
    metaWrap.style.cssText =
      "margin-left:12px;display:flex;flex-direction:column;justify-content:center;gap:6px;min-width:180px;";
    const fileNameText = document.createElement("div");
    fileNameText.style.cssText =
      "font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    fileNameText.textContent =
      meta.filename ||
      (cvPath
        ? filenameFromPath(cvPath)
        : currentLang === "ar"
        ? "لا يوجد ملف"
        : "No file");

    const dateText = document.createElement("div");
    dateText.style.cssText = "font-size:12px;color:#6b6b6b;";
    dateText.textContent = meta.updatedAt ? formatDate(meta.updatedAt) : "";

    metaWrap.appendChild(fileNameText);
    metaWrap.appendChild(dateText);

    // Place meta next to preview (if you want different placement adjust in HTML/CSS)
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
        // If backend returns downloadUrl, re-render UI with that path.
        // Try to extract filename & updatedAt (if returned)
        const filename =
          res?.data?.urlInfo?.filename ||
          res?.data?.fileName ||
          filenameFromPath(downloadUrl);
        const updatedAt =
          res?.data?.updatedAt ||
          res?.data?.urlInfo?.updatedAt ||
          new Date().toISOString();

        renderCvUI(downloadUrl, { filename, updatedAt });
        showToast(`✅ ${msg}`, "success");
      } else {
        // fallback: refresh user details to get cvPath
        try {
          const refreshed = await getUserDetails();
          const newCv = refreshed?.data?.currentUser?.cvPath || null;
          const updatedAt =
            refreshed?.data?.currentUser?.updatedAt ||
            refreshed?.data?.currentUser?.createdAt ||
            new Date().toISOString();
          const filename = filenameFromPath(newCv);
          renderCvUI(newCv, { filename, updatedAt });
          showToast(`✅ ${msg}`, "success");
        } catch (err) {
          // if refresh fails, still notify success if server said so
          renderCvUI(null, {});
          showToast(`✅ ${msg}`, "success");
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errMsg =
        err?.response?.data?.msg ||
        err?.message ||
        (currentLang === "ar" ? "حدث خطأ أثناء الرفع" : "Upload error");
      showToast(`⚠️ ${errMsg}`, "error");
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

      user = response?.data?.currentUser || null;
  const res = await getAllCourses();
      const jobsNamesRes = await getJobNames();
      const jobNames = jobsNamesRes.data.jobNames;

    const suggestedCourses = res.data.courses;
    const suggestedCoursesList = document.getElementById;
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
        filename: user ? filenameFromPath(user.cvPath) : null,
        updatedAt: user?.updatedAt || user?.createdAt || null,
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
