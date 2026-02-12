import { sendAtsRequest, getAtsStatus, getUserDetails } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".ats-action");

  const progressPanel = document.getElementById("progressPanel");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressFill = document.getElementById("progressFill");
  const progressDetails = document.getElementById("progressDetails");
  const progressAction = document.getElementById("progressAction");

  let pollCount = 0;
  let requestId = null;
  let currentFlow = null; // 👈 assessment | enhance

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

  /* ================= PROGRESS ================= */
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
    requestId = null;
    currentFlow = null;

    progressPercentage.textContent = "0%";
    progressFill.style.width = "0%";
    progressDetails.innerHTML = "";
    progressAction.style.display = "none";

    closeProgress();
  }

  /* ================= START FLOW ================= */
  async function startFlow(type) {
    try {
      currentFlow = type;
      pollCount = 0;

      openProgress(
        type === "assessment"
          ? "Starting ATS analysis..."
          : "Starting CV enhancement...",
      );

      updateProgress(
        10,
        type === "assessment"
          ? "Sending ATS request..."
          : "Sending enhancement request...",
      );

      const res = await sendAtsRequest({ type });

      if (!res?.data?.status) {
        throw new Error(res?.data?.msg || "Request failed");
      }

      requestId = res.data?.data?.requestId || "latest";

      updateProgress(25, "Request created successfully");
      pollStatus(requestId);
    } catch (err) {
      showToast(err.message || "Process error", "error");
      resetUI();
    }
  }

  /* ================= POLLING ================= */
  async function pollStatus(id) {
    try {
      await new Promise((r) => setTimeout(r, 2000));

      pollCount++;
  updateProgress(
    Math.min(pollCount * 10 + 25, 95),
    currentFlow === "assessment"
      ? "Analyzing your CV..."
      : "Enhancing your CV...",
  );


      const res = await getAtsStatus(id);
      const status = res?.data?.data?.status?.toUpperCase();

      if (status === "DONE" || status === "COMPLETED") {
        updateProgress(
          100,
          currentFlow === "assessment"
            ? "ATS analysis completed 🎉"
            : "CV enhancement completed 🎉",
        );

        progressAction.style.display = "block";
        progressAction.onclick = () => {
          if (currentFlow === "assessment") {
            window.location.href = "/ats.html";
          } else {
            window.location.href = "/CvEnhancment.html";
          }
        };

        return;
      }

      if (status === "FAILED") {
        throw new Error("Process failed");
      }

      pollStatus(id);
    } catch (err) {
      showToast(err.message, "error");
      resetUI();
    }
  }

  /* ================= MAIN BUTTON HANDLER ================= */
  buttons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const logged = await isLoggedIn();

      if (!logged) {
        showToast("⚠️ Please log in first", "error");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
        return;
      }

      const action = btn.dataset.action;

      if (action === "assessment") {
        startFlow("assessment");
      }

      if (action === "enhance") {
        startFlow("enhance");
      }

      if (!action && btn.tagName === "A") {
        window.location.href = btn.href;
      }
    });
  });
});
