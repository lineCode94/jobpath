import { sendAtsRequest, getAtsStatus, getUserDetails } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
const assessmentBtn = document.querySelector(
  '.ats-action[data-action="assessment"]',
);


  const progressPanel = document.getElementById("progressPanel");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressFill = document.getElementById("progressFill");
  const progressDetails = document.getElementById("progressDetails");
  const progressAction = document.getElementById("progressAction");

  let pollCount = 0;
  let pollingActive = false;
  const MAX_POLLS = 30; // أقصى مدة انتظار ~ 60 ثانية
  // ===== translation =====
    function t(ar, en) {
      return (localStorage.getItem("lang") || "en") === "ar" ? ar : en;
    }
  /* ================= Toast ================= */
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

  /* ================= AUTH CHECK ================= */
  async function isLoggedIn() {
    try {
      const res = await getUserDetails();
      const user = res?.currentUser || res?.data?.currentUser;
      return !!user?.id;
    } catch {
      return false;
    }
  }

  /* ================= UI ================= */
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
      progressDetails.innerHTML = `<p>${message}</p>`;
    }
  }

  function resetUI() {
    pollCount = 0;
    pollingActive = false;

    progressPercentage.textContent = "0%";
    progressFill.style.width = "0%";
    progressDetails.innerHTML = "";
    progressAction.style.display = "none";

    closeProgress();
  }

  /* ================= START ASSESSMENT ================= */
  async function startAssessment() {
    try {
      pollCount = 0;
      pollingActive = true;

      openProgress(t("جاري تحليل السيرة الذاتية", "Analyzing CV"));
      updateProgress(10,  t("جاري تحليل السيرة الذاتية", "Analyzing CV"));

      const res = await sendAtsRequest();

      if (!res?.data?.status) {
        throw new Error(res?.data?.msg || "Request failed");
      }

      updateProgress(25,  t("جاري تحليل السيرة الذاتية...", "Analyzing CV..."));

      pollStatus();
    } catch (err) {
      showToast(err.message || "Process error", "error");
      resetUI();
    }
  }

  /* ================= POLLING ================= */
  async function pollStatus() {
    if (!pollingActive) return;

    try {
      if (pollCount >= MAX_POLLS) {
        throw new Error("Processing is taking too long. Please try again.");
      }

      await new Promise((r) => setTimeout(r, 2000));

      pollCount++;

      updateProgress(Math.min(pollCount * 5 + 25, 95),  t("جاري تحليل السيرة الذاتية...", "Analyzing CV..."));

      const res = await getAtsStatus();
      const status = res?.data?.data?.status?.toUpperCase();

      if (status === "DONE" || status === "COMPLETED") {
        pollingActive = false;

        updateProgress(100,  t("تم تحليل السيرة الذاتية", "CV analyzed successfully"));

        progressAction.style.display = "block";
        progressAction.onclick = () => {
          window.location.href = "/ats.html";
        };

        return;
      }

      if (status === "FAILED") {
        throw new Error("Process failed");
      }

      pollStatus();
    } catch (err) {
      showToast(err.message || "Process error", "error");
      resetUI();
    }
  }

  /* ================= BUTTON HANDLER ================= */
if (assessmentBtn) {
  assessmentBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const logged = await isLoggedIn();

    if (!logged) {
      showToast("⚠️ Please log in first", "error");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
      return;
    }

    startAssessment();
  });
}


});
