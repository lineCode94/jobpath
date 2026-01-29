import {
  sendCvEnhancementRequest,
  getCvEnhancementStatus,
  getUserDetails,
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const enhanceBtn = document.querySelector(
    "button[onclick=\"startProcess('enhance')\"]",
  );

  if (!enhanceBtn) return;

  const progressPanel = document.getElementById("progressPanel");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressFill = document.getElementById("progressFill");
  const progressDetails = document.getElementById("progressDetails");
  const progressAction = document.getElementById("progressAction");

  let pollCount = 0;
  let jobId = null;

  // ===== Toast =====
  function showToast(message, type = "info") {
    const colors = {
      info: "#333",
      success: "#28a745",
      error: "#dc3545",
    };

    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: colors[type] || colors.info,
    }).showToast();
  }

  // ===== Progress UI =====
  function openProgress(message) {
    progressPanel.style.display = "flex";
    progressAction.style.display = "none";
    progressDetails.innerHTML = `<p id="progressMessage"></p>`;
    updateProgress(0, message);
  }

  function closeProgress() {
    progressPanel.style.display = "none";
  }

  function updateProgress(percent, message) {
    progressPercentage.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;

    if (message) {
      const msgEl = document.getElementById("progressMessage");
      if (msgEl) msgEl.textContent = message;
    }
  }

  function resetUI() {
    enhanceBtn.disabled = false;
    pollCount = 0;
    jobId = null;

    progressPercentage.textContent = "0%";
    progressFill.style.width = "0%";
    progressDetails.innerHTML = "";
    progressAction.style.display = "none";

    closeProgress();
  }

  // ===== Validate User =====
  async function validateUser() {
    try {
      const res = await getUserDetails();
      const user = res?.currentUser || res?.data?.currentUser;

      if (!user || !user.cvPath || !user.jobTitle) {
        window.location.href = "/AtsError.html";
        return null;
      }

      return user;
    } catch (err) {
      window.location.href = "/AtsError.html";
      return null;
    }
  }

  // ===== Start Enhancement =====
  async function startEnhancementFlow() {
    try {
      enhanceBtn.disabled = true;
      openProgress("Starting CV enhancement...");

      const user = await validateUser();
      if (!user) return;

      updateProgress(10, "Sending CV enhancement request...");
      const res = await sendCvEnhancementRequest();

      if (!res?.data?.status) {
        throw new Error(res?.data?.msg || "CV enhancement request failed");
      }

      showToast(res.data.msg, "success");

      jobId = res.data.jobId || res.data.data?.jobId;
      if (!jobId) throw new Error("Job ID not returned");

      updateProgress(25, "CV enhancement started");
      pollEnhancement(jobId, 2);
    } catch (err) {
      showToast(err.message, "error");
      resetUI();
    }
  }

  // ===== Polling =====
  async function pollEnhancement(id, delaySeconds = 2) {
    try {
      await new Promise((r) => setTimeout(r, delaySeconds * 1000));

      pollCount++;
      updateProgress(Math.min(pollCount * 10 + 25, 95), "Enhancing your CV...");

      const res = await getCvEnhancementStatus(id);
      const status = res?.data?.data?.status?.toUpperCase();

      if (status === "DONE" || status === "COMPLETED") {
        updateProgress(100, "CV enhancement completed 🎉");
        showToast("CV enhancement completed", "success");

        progressAction.style.display = "block";
        progressAction.onclick = () => {
          window.location.href = "/CvEnhancment.html";
        };
        return;
      }

      if (status === "FAILED") {
        throw new Error(res?.data?.data?.lastError || "CV enhancement failed");
      }

      pollEnhancement(id, 3);
    } catch (err) {
      showToast(err.message, "error");
      resetUI();
    }
  }

  // ===== Expose for inline button =====
  window.startProcess = function (type) {
    if (type === "enhance") startEnhancementFlow();
  };
});
