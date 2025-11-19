// cv-logic.js
// All CV related logic extracted into this standalone module

// --- Imports ---
import { uploadCv, getCvMeta, setAuthToken, getUserDetails } from "./api.js";

// --- DOM nodes (guarded: may be missing on some pages) ---
const cvContainer = document.getElementById("cvUploadDiv"); // main wrapper (recommended)
// const cvForm = document.getElementById("cvForm");
const cvInput = document.getElementById("cv");
const cvDownloadDiv = document.getElementById("cvDownloadDiv");
const cvUploadingDiv = document.getElementById("cvUploadingDiv");
const cvPreviewDiv = document.getElementById("cvPreviewDiv");

const currentLang = localStorage.getItem("lang") || "en";
if (!cvPath) {
  downloadBtn.disabled = true;
  downloadBtn.title = currentLang === "ar" ? "لا يوجد سيرة ذاتية" : "No CV";
  downloadBtn.style.opacity = "0.45";
} else {
  downloadBtn.title =
    currentLang === "ar" ? "تحميل السيرة الذاتية" : "Download CV";
  downloadBtn.addEventListener("click", () => {
    // suggest filename from path or meta.filename
    const suggestedName = meta.filename || filenameFromPath(cvPath) || "cv.pdf";
    secureDownload(cvPath, suggestedName);
  });
}
cvDownloadDiv.appendChild(downloadBtn);
// ---------------- Helpers ----------------
export function filenameFromPath(path) {
  if (!path) return null;
  try {
    // if it's a full URL, use URL to decode properly
    const u = new URL(path);
    return decodeURIComponent(u.pathname.split("/").pop());
  } catch {
    const parts = path.split("/").pop();
    return parts || null;
  }
}

function showToast(message, type = "info") {
  // If Toastify available on page, use it (keeps styling consistent).
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      duration: 3000,
      close: true,
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
    return;
  }

  // Simple fallback toast
  const t = document.createElement("div");
  t.textContent = message;
  t.style.cssText =
    "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:8px 12px;border-radius:6px;z-index:99999;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
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

// ---------------- Secure fetch helpers ----------------
async function secureFetchBlob(url) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const blob = await res.blob();
  return blob;
}

async function secureDownload(url, suggestedName = "cv.pdf") {
  try {
    const blob = await secureFetchBlob(url);
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("secureDownload error:", err);
    showToast(
      currentLang === "ar"
        ? "⚠️ فشل تحميل السيرة الذاتية"
        : "⚠️ Failed to download CV",
      "error"
    );
  }
}

async function secureOpenInNewTab(url) {
  try {
    const blob = await secureFetchBlob(url);
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    // Do not revoke immediately; allow browser to load. Browser will free later.
  } catch (err) {
    console.error("secureOpenInNewTab error:", err);
    showToast(
      currentLang === "ar"
        ? "⚠️ فشل فتح المعاينة"
        : "⚠️ Failed to open preview",
      "error"
    );
  }
}

// ---------------- Fetch CV metadata ----------------
export async function fetchCvMetadata() {
  try {
    const res = await getCvMeta(); // API helper from api.js
    return {
      size: res?.data?.metadata?.size || null,
      mimeType: res?.data?.metadata?.mimeType || null,
      updatedAt: res?.data?.metadata?.date || null,
    };
  } catch (err) {
    console.error("CV Metadata Error:", err);
    return {};
  }
}

// ---------------- Render CV UI ----------------
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
  // allowed types (PDF, DOCX, DOC)
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  // size check: prefer to consult backend metadata endpoint if you want authoritative limit.
  // We'll use 5MB as a safe default (adjust as backend requires).
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    showToast(
      currentLang === "ar"
        ? "⚠️ حجم الملف أكبر من المسموح (5MB)."
        : "⚠️ File size exceeds 5MB.",
      "warning"
    );
    return;
  }

  if (!allowed.includes(file.type)) {
    showToast(
      currentLang === "ar"
        ? "⚠️ امتداد الملف غير مدعوم. استخدم PDF أو DOCX."
        : "⚠️ Unsupported file type. Use PDF or DOCX.",
      "warning"
    );
    return;
  }

  // show spinner while uploading
  if (cvUploadingDiv) {
    cvUploadingDiv.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
      <span class="spinner-border" role="status" aria-hidden="true" style="width:20px;height:20px;"></span>
      <span style="font-size:14px;">${
        currentLang === "ar" ? "جاري الرفع..." : "Uploading..."
      }</span>
    </div>`;
  }

  try {
    const formData = new FormData();
    formData.append("cv", file);

    const res = await uploadCv(formData); // uploadCv from api.js

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
      const filename =
        res?.data?.urlInfo?.filename ||
        res?.data?.fileName ||
        filenameFromPath(downloadUrl);
      const updatedAt =
        res?.data?.updatedAt ||
        res?.data?.urlInfo?.updatedAt ||
        new Date().toISOString();

      renderCvUI(downloadUrl, {
        filename,
        updatedAt,
        size: file.size,
        mimeType: file.type,
      });
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
    if (cvUploadingDiv) cvUploadingDiv.innerHTML = "";
    if (cvInput) cvInput.value = "";
  }
}

// ---------------- Module initializer ----------------
/**
 * initCvModule(options?)
 * - options.forceRender: boolean — render UI even if not logged in
 *
 * Call this from profile.js after DOMContentLoaded:
 *   import { initCvModule } from './cv-logic.js'
 *   initCvModule()
 */
export async function initCvModule(options = {}) {
  // ensure auth token applied if exists
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      setAuthToken(token);
    } catch {
      // ignore if setAuthToken not available
    }
  }

  // attach file input listener if the page provides a cvInput
  if (cvInput) {
    cvInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (file) await handleAutoUpload(file);
    });
  }

  // Attempt to get current user's cvPath (if logged in)
  if (token || options.forceRender) {
    try {
      const response = await getUserDetails();
      const user = response?.data?.currentUser || null;
      const cvPath = user?.cvPath || null;

      // Try to get metadata (size, mime, date) from metadata endpoint
      let meta = {};
      try {
        meta = await fetchCvMetadata();
      } catch (err) {
        meta = {};
      }

      // prefer metadata filename if available
      if (meta?.mimeType === "application/pdf" && !meta.filename) {
        meta.filename = filenameFromPath(cvPath);
      }

      // map date key if returned differently
      if (meta?.updatedAt === null && user?.updatedAt)
        meta.updatedAt = user.updatedAt;

      renderCvUI(cvPath, meta);
    } catch (err) {
      console.error("initCvModule: could not fetch user details", err);
      renderCvUI(null, {});
    }
  } else {
    // not logged in, render disabled/empty UI
    renderCvUI(null, {});
  }
}

// ---------------- Convenience preview/download functions (buffer-based) ----------------
export function previewCV(buffer, mimeType = "application/pdf") {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export function downloadCV(
  buffer,
  filename = "cv.pdf",
  mimeType = "application/pdf"
) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
