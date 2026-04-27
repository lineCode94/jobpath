import { getUserDetails, uploadCv, linkedinOptimizer } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const uploadCvBtn = document.getElementById("uploadCvBtn");
  const cvInput = document.getElementById("cvUploadInput");
  const useExistingBtn = document.getElementById("useExistingBtn");
  const pasteTextArea = document.getElementById("cvText");
  const continueBtn = document.getElementById("continueBtn");

  const uploadedCvNameEl = document.getElementById("uploadedCvName");
  const existingCvNameEl = document.getElementById("existingCvName");

  const skeleton = document.getElementById("pageSkeleton");
  const content = document.getElementById("pageContent");

  const optionCards = document.querySelectorAll(".cv-option");

  let user = null;
  let uploadedFile = null;
  let selectedOption = null;
  let hasExistingCv = false;

  const originalBtnHTML = continueBtn.innerHTML;

  /* ================= LOADING BUTTON ================= */
  function setLoading(state) {
    if (state) {
      continueBtn.disabled = true;
      continueBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Processing...
      `;
    } else {
      continueBtn.disabled = false;
      continueBtn.innerHTML = originalBtnHTML;
    }
  }

  /* ================= LOAD USER WITH SKELETON ================= */
  try {
    const res = await getUserDetails();
    user = res?.data?.currentUser || res?.currentUser;

    if (user?.cvPath) {
      hasExistingCv = true;
      const fileName = user.cvPath.split("/").pop();
      existingCvNameEl.textContent = `Saved CV: ${fileName}`;
    } else {
      hasExistingCv = false;
      existingCvNameEl.textContent = "No CV uploaded";
      useExistingBtn.disabled = true;

      const existingCard = document.getElementById("existingCard");
      existingCard?.classList.add("disabled");
    }
  } catch (e) {
    console.error(e);
  } finally {
    skeleton.classList.add("fade-out");

    setTimeout(() => {
      skeleton.style.display = "none";
      content.style.display = "block";
      content.classList.add("fade-in");
    }, 300);
  }

  /* ================= ACTIVE CARD ================= */
  function setActive(type) {
    selectedOption = type;

    optionCards.forEach((card) => {
      card.classList.remove("active");
      if (card.dataset.type === type) {
        card.classList.add("active");
      }
    });

    updateContinueState();
  }

  /* ================= CLICK CARDS ================= */
  optionCards.forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.type;

      if (type === "upload") uploadCvBtn.click();
      if (type === "existing") useExistingBtn.click();
      if (type === "paste") pasteTextArea.focus();
    });
  });

  /* ================= UPLOAD ================= */
  uploadCvBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    cvInput.click();
  });

  cvInput.addEventListener("change", async () => {
    if (!cvInput.files.length) return;

    uploadedFile = cvInput.files[0];
    setActive("upload");

    uploadedCvNameEl.textContent = `Uploaded: ${uploadedFile.name}`;

    const fd = new FormData();
    fd.append("cv", uploadedFile);

    try {
      await uploadCv(fd);
      showToast("Uploaded successfully");
    } catch {
      showToast("Upload failed", "danger");
    }
  });

  /* ================= EXISTING ================= */
  useExistingBtn.addEventListener("click", () => {
    if (!hasExistingCv) return;

    uploadedFile = "existing";
    setActive("existing");

    const fileName = user.cvPath.split("/").pop();
    existingCvNameEl.textContent = `Using: ${fileName}`;
  });

  /* ================= PASTE ================= */
  pasteTextArea.addEventListener("focus", () => {
    uploadedFile = null;
    setActive("paste");
  });

  pasteTextArea.addEventListener("input", updateContinueState);

  function getPastedText() {
    return pasteTextArea.value.trim();
  }

  /* ================= CONTINUE ENABLE ================= */
  function updateContinueState() {
    let valid = false;

    if (selectedOption === "upload" && uploadedFile) valid = true;
    if (selectedOption === "existing" && hasExistingCv) valid = true;
    if (selectedOption === "paste" && getPastedText()) valid = true;

    continueBtn.disabled = !valid;

    continueBtn.style.opacity = valid ? "1" : "0.5";
    continueBtn.style.cursor = valid ? "pointer" : "not-allowed";
  }

  continueBtn.disabled = true;

  /* ================= CONTINUE ================= */
  continueBtn.addEventListener("click", async () => {
    const fd = new FormData();

    // 🔥 START LOADING
    setLoading(true);

    try {
      if (selectedOption === "upload") {
        fd.append("file", uploadedFile);
      } else if (selectedOption === "existing") {
        fd.append("existingCV", true);
      } else {
        fd.append("pastedText", getPastedText());
      }

      const res = await linkedinOptimizer(fd);

      localStorage.setItem("linkedinData", JSON.stringify(res.data.data));

      showToast("Processing done 🚀");

      setTimeout(() => {
        window.location.href = "linkedInEnhancer-2.html";
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("Failed", "danger");

      // 🔥 RESET ON ERROR
      setLoading(false);
    }
  });
});

/* ================= TOAST ================= */
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const el = document.createElement("div");
  el.className = `toast text-bg-${type} border-0`;
  el.innerHTML = `<div class="toast-body">${message}</div>`;

  toastContainer.appendChild(el);
  new bootstrap.Toast(el).show();

  el.addEventListener("hidden.bs.toast", () => el.remove());
}
