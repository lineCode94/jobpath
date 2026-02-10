import { sendAtsRequest, getAtsStatus, getUserDetails } from "./api.js";
// import { requireAuth } from "./ats-guard.js";
document.addEventListener("DOMContentLoaded", async() => {
  const atsBtn = document.getElementById("atsBtn");

  const progressPanel = document.getElementById("progressPanel");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressFill = document.getElementById("progressFill");
  const progressDetails = document.getElementById("progressDetails");
  const progressAction = document.getElementById("progressAction");

  if (!atsBtn) return;

  let pollCount = 0;
  let requestId = null;

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
    progressDetails.innerHTML = "";
    progressAction.style.display = "none";
    updateProgress(0, message);
  }

  function closeProgress() {
    progressPanel.style.display = "none";
  }

  function updateProgress(percent, message) {
    progressPercentage.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;

    if (message) {
      const p = document.createElement("p");
      p.textContent = message;
      progressDetails.appendChild(p);
    }
  }

  function resetUI() {
    atsBtn.disabled = false;
    pollCount = 0;
    requestId = null;

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

      console.log("ATS user:", user);

      if (!user || !user.cvPath || !user.jobTitle) {
        window.location.href = "/AtsError.html";
        return null;
      }

      return user;
    } catch (err) {
      console.error("User validation error", err);
      window.location.href = "/AtsError.html";
      return null;
    }
  }

  // ===== Start ATS Flow =====
  async function startATSFlow() {
    try {
      atsBtn.disabled = true;
      openProgress("Starting ATS analysis...");

      const user = await validateUser();
      if (!user) return;

      updateProgress(10, "Sending ATS request...");
      const res = await sendAtsRequest();

      if (!res?.data?.status) {
        throw new Error(res?.data?.msg || "ATS request failed");
      }

      showToast(res.data.msg, "success");

      requestId = res.data?.data?.requestId || res.data?.requestId || "latest";

      updateProgress(25, "ATS request created");
      pollAtsStatus(requestId, 2);
    } catch (err) {
      console.error(err);
      showToast(err.message || "ATS error", "error");
      resetUI();
    }
  }

  // ===== Poll ATS =====
  async function pollAtsStatus(id, delaySeconds = 2) {
    try {
      await new Promise((r) => setTimeout(r, delaySeconds * 1000));

      pollCount++;
      updateProgress(
        Math.min(pollCount * 10 + 25, 95),
        `Analyzing CV (step ${pollCount})...`,
      );

      const res = await getAtsStatus(id);
      const status = res?.data?.data?.status?.toUpperCase();

      console.log("ATS STATUS:", status);

      if (status === "DONE" || status === "COMPLETED") {
        updateProgress(100, "ATS analysis completed 🎉");
        showToast("ATS analysis completed", "success");

        progressAction.style.display = "block";
        progressAction.onclick = () => {
          window.location.href = "/ats.html";
        };
        return;
      }

      if (status === "FAILED") {
        throw new Error(res?.data?.data?.lastError || "ATS failed");
      }

      pollAtsStatus(id, 3);
    } catch (err) {
      showToast(err.message, "error");
      resetUI();
    }
  }

  atsBtn.addEventListener("click", startATSFlow);
});
