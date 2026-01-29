import { getUserDetails, uploadCv, updateProfile } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const openJobBtn = document.getElementById("openJobTitleBtn");
  const uploadCvBtn = document.getElementById("uploadCvBtn");
  const cvInput = document.getElementById("cvUploadInput");

  const jobModalEl = document.getElementById("jobTitleModal");
  const jobInput = document.getElementById("jobTitleInput");
  const saveJobBtn = document.getElementById("saveJobTitleBtn");

  let user = null;

  // load user
  try {
    const res = await getUserDetails();
    user = res?.data?.currentUser || res?.currentUser;
  } catch (e) {
    console.error("Failed to load user:", e);
  }

  // open modal
  openJobBtn?.addEventListener("click", () => {
    const modal = new bootstrap.Modal(jobModalEl);
    modal.show();
  });

  // save job title
  saveJobBtn?.addEventListener("click", async () => {
    const value = jobInput.value.trim();
    if (!value) return;

    const fd = new FormData();
    fd.append("jobTitle", value);

    try {
      await updateProfile(fd);
      bootstrap.Modal.getInstance(jobModalEl).hide();
      showToast("Job title updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update job title", "danger");
    }
  });

  // trigger file input
  uploadCvBtn?.addEventListener("click", () => {
    cvInput.click();
  });

  // handle CV upload
  cvInput?.addEventListener("change", async () => {
    if (!cvInput.files.length) return;

    const fd = new FormData();
    fd.append("cv", cvInput.files[0]);

    try {
      await uploadCv(fd); // استخدام endpoint المخصص للـ CV
      showToast("CV uploaded successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload CV", "danger");
    }
  });
});

// toast helper
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}
