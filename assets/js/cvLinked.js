import { getUserDetails, uploadCv, linkedinOptimizer } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const uploadCvBtn = document.getElementById("uploadCvBtn");
  const cvInput = document.getElementById("cvUploadInput");

  const useExistingBtn = document.getElementById("useExistingBtn");
  const pasteTextArea = document.getElementById("cvText");
  const continueBtn = document.getElementById("continueBtn");

  const uploadedCvNameEl = document.getElementById("uploadedCvName");
  const existingCvNameEl = document.getElementById("existingCvName");
let selectedOption = null;
const optionCards = document.querySelectorAll(".cv-option");
  let user = null;
  let uploadedFile = null;
let hasExistingCv = false;
  
// set active card
function setActiveOption(type) {
  selectedOption = type;

  optionCards.forEach((card) => {
    card.classList.remove("active");

    if (card.dataset.type === type) {
      card.classList.add("active");
    }
  });
}
optionCards.forEach(card => {
  card.addEventListener("click", () => {
    const type = card.dataset.type;

    if (type === "upload") {
      uploadCvBtn.click();
    }

    if (type === "existing") {
      useExistingBtn.click();
    }

    if (type === "paste") {
      pasteTextArea.focus();
    }
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
  }
  } catch (e) {
    console.error("Failed to load user:", e);
  }

  /* ================= RESET SELECTION ================= */
  function resetSelections(type) {
    if (type !== "upload") {
      uploadedFile = null;
      uploadedCvNameEl.textContent = "";
    }

    if (type !== "existing") {
      if (user?.cvPath) {
        const fileName = user.cvPath.split("/").pop();
        existingCvNameEl.textContent = `Saved CV: ${fileName}`;
      }
    }

    if (type !== "paste") {
      pasteTextArea.value = "";
    }
  }

  /* ================= OPTION 1: UPLOAD ================= */
  uploadCvBtn?.addEventListener("click", () => {
    cvInput.click();
  });

  cvInput?.addEventListener("change", async () => {
    if (!cvInput.files.length) return;

    resetSelections("upload");
    setActiveOption("upload");
    uploadedFile = cvInput.files[0];

    // ✅ show file name
    uploadedCvNameEl.textContent = `Uploaded: ${uploadedFile.name}`;

    updateContinueState(); // 🔥 مهم

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

  /* ================= OPTION 2: EXISTING CV ================= */
  useExistingBtn?.addEventListener("click", () => {
    if (!user?.cvPath) {
      showToast("No CV found in your profile", "danger");
      return;
    }

    resetSelections("existing");
    setActiveOption("existing"); // 🔥 مهم
    uploadedFile = "existing";

    updateContinueState(); // 🔥 مهم
    const fileName = user.cvPath.split("/").pop();
    existingCvNameEl.textContent = `Using: ${fileName}`;
    // existingCvNameEl.style.color = "green";

    showToast("Using your saved CV", "success");
  });

  /* ================= OPTION 3: PASTE ================= */
  function getPastedText() {
    return pasteTextArea?.value.trim();
  }

// لما يدخل على التكسيت
pasteTextArea?.addEventListener("focus", () => {
  resetSelections("paste");
  setActiveOption("paste");
  uploadedFile = null;
});

// لما يكتب
pasteTextArea?.addEventListener("input", () => {
  updateContinueState();
});

  /* ================= CONTINUE ================= */
  function updateContinueState() {
    let isValid = false;

    if (selectedOption === "upload" && uploadedFile) {
      isValid = true;
    } else if (selectedOption === "existing" && user?.cvPath) {
      isValid = true;
    } else if (selectedOption === "paste" && getPastedText()) {
      isValid = true;
    }

    continueBtn.disabled = !isValid;

    // optional style
    continueBtn.style.opacity = isValid ? "1" : "0.5";
    continueBtn.style.cursor = isValid ? "pointer" : "not-allowed";
  }
continueBtn?.addEventListener("click", async () => {
  console.log("Selected:", selectedOption);

  const fd = new FormData();

  try {
    if (selectedOption === "upload" && uploadedFile) {
      fd.append("file", uploadedFile);
    } else if (selectedOption === "existing" && user?.cvPath) {
      fd.append("existingCV", hasExistingCv);

      console.log(true);
    } else if (selectedOption === "paste" && getPastedText()) {
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
  toastEl.setAttribute("role", "alert");

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
