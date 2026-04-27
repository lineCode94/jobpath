import { getUserDetails, uploadCv, linkedinOptimizer } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const uploadCvBtn = document.getElementById("uploadCvBtn");
  const cvInput = document.getElementById("cvUploadInput");

  const useExistingBtn = document.getElementById("useExistingBtn");
  const pasteTextArea = document.getElementById("cvText");
  const continueBtn = document.getElementById("continueBtn");

  const uploadedCvNameEl = document.getElementById("uploadedCvName");
  const existingCvNameEl = document.getElementById("existingCvName");

  const optionCards = document.querySelectorAll(".cv-option");
  const existingCard = document.getElementById("existingCard");

  const loader = document.getElementById("pageLoader");
  const mainContent = document.getElementById("mainContent");

  let selectedOption = null;
  let user = null;
  let uploadedFile = null;
  let hasExistingCv = false;

  /* ================= ACTIVE CARD ================= */
  function setActiveOption(type) {
    selectedOption = type;

    optionCards.forEach((card) => {
      card.classList.remove("active");

      if (card.dataset.type === type) {
        card.classList.add("active");
      }
    });
  }

  /* ================= CARD CLICK ================= */
  optionCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (card.classList.contains("disabled")) return;

      const type = card.dataset.type;
      setActiveOption(type);

      if (type === "upload") uploadCvBtn.click();
      if (type === "existing") useExistingBtn.click();
      if (type === "paste") pasteTextArea.focus();
    });
  });

  /* ================= LOAD USER ================= */
  try {
    const res = await getUserDetails();
    user = res?.data?.currentUser || res?.currentUser;

    if (user?.cvPath) {
      hasExistingCv = true;
      const fileName = user.cvPath.split("/").pop();
      existingCvNameEl.textContent = `Saved CV: ${fileName}`;
    } else {
      hasExistingCv = false;
      existingCvNameEl.textContent = "No CV uploaded yet";

      // disable existing option
      existingCard?.classList.add("disabled");
      useExistingBtn.disabled = true;
    }
  } catch (e) {
    console.error("Failed to load user:", e);
  }

  // 🔥 hide loader & show page
  loader && (loader.style.display = "none");
  mainContent && (mainContent.style.display = "block");

  /* ================= RESET ================= */
  function resetSelections(type) {
    if (type !== "upload") {
      uploadedFile = null;
      uploadedCvNameEl.textContent = "";
    }

    if (type !== "existing" && user?.cvPath) {
      const fileName = user.cvPath.split("/").pop();
      existingCvNameEl.textContent = `Saved CV: ${fileName}`;
    }

    if (type !== "paste") {
      pasteTextArea.value = "";
    }
  }

  /* ================= OPTION 1: UPLOAD ================= */

  uploadCvBtn?.addEventListener("click", (e) => {
    e.stopPropagation(); // 🔥 FIX double open
    cvInput.click();
  });

  cvInput?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  cvInput?.addEventListener("change", async () => {
    if (!cvInput.files.length) return;

    resetSelections("upload");
    setActiveOption("upload");

    uploadedFile = cvInput.files[0];

    uploadedCvNameEl.textContent = `Uploaded: ${uploadedFile.name}`;

    updateContinueState();

    const fd = new FormData();
    fd.append("cv", uploadedFile);

    try {
      await uploadCv(fd);
      showToast("CV uploaded successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload CV", "danger");
    }
  });

  /* ================= OPTION 2: EXISTING ================= */

  useExistingBtn?.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!hasExistingCv) return;

    resetSelections("existing");
    setActiveOption("existing");

    uploadedFile = "existing";

    const fileName = user.cvPath.split("/").pop();
    existingCvNameEl.textContent = `Using: ${fileName}`;

    updateContinueState();

    showToast("Using your saved CV", "success");
  });

  /* ================= OPTION 3: PASTE ================= */

  function getPastedText() {
    return pasteTextArea?.value.trim();
  }

  pasteTextArea?.addEventListener("focus", () => {
    resetSelections("paste");
    setActiveOption("paste");
    uploadedFile = null;
  });

  pasteTextArea?.addEventListener("input", () => {
    updateContinueState();
  });

  /* ================= CONTINUE BUTTON STATE ================= */

  function updateContinueState() {
    let isValid = false;

    if (selectedOption === "upload" && uploadedFile) {
      isValid = true;
    } else if (selectedOption === "existing" && hasExistingCv) {
      isValid = true;
    } else if (selectedOption === "paste" && getPastedText()) {
      isValid = true;
    }

    continueBtn.disabled = !isValid;

    continueBtn.style.opacity = isValid ? "1" : "0.5";
    continueBtn.style.cursor = isValid ? "pointer" : "not-allowed";
  }

  /* ================= CONTINUE ================= */

  continueBtn?.addEventListener("click", async () => {
    const fd = new FormData();

    try {
      if (selectedOption === "upload" && uploadedFile) {
        fd.append("file", uploadedFile);
      } else if (selectedOption === "existing") {
        fd.append("existingCV", user.cvPath);
      } else if (selectedOption === "paste") {
        fd.append("pastedText", getPastedText());
      } else {
        showToast("Please complete your selection", "danger");
        return;
      }

      const res = await linkedinOptimizer(fd);

      localStorage.setItem("linkedinData", JSON.stringify(res.data.data));

      showToast("CV processed successfully 🚀", "success");

      setTimeout(() => {
        window.location.href = "linkedInEnhancer-2.html";
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("Failed to process CV", "danger");
    }
  });
});

/* ================= TOAST ================= */
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);

  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();

  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}
