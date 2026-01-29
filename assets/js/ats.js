import { sendAtsRequest, getAtsStatus } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const atsBtn = document.getElementById("atsBtn");
  const loadingPanel = document.getElementById("progressPanel");
  const apiStatus = document.getElementById("apiStatus");
  const pollingStatus = document.getElementById("pollingStatus");
  const pollCountElement = document.getElementById("pollCount");

  let pollCount = 0;
  let requestId = null;

  if (!atsBtn) return;

  // ===== Toast =====
  function showToast(message, type = "info") {
    let bgColor = "#333";
    if (type === "success") bgColor = "#28a745";
    if (type === "error") bgColor = "#dc3545";

    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: bgColor,
    }).showToast();
  }

  // ===== Start ATS =====
  async function startATSFlow() {
    try {
      atsBtn.disabled = true;
      loadingPanel.classList.add("active");

      apiStatus.textContent = "Sending request...";
      pollingStatus.textContent = "Waiting...";
      pollCountElement.textContent = "0%";

      const res = await sendAtsRequest();

      if (!res?.data?.status) {
        throw new Error(res?.data?.msg || "ATS request failed");
      }

      showToast(res.data.msg, "success");
      apiStatus.textContent = "Request sent";

      requestId =
        res.data.data?.requestId ||
        res.data.requestId ||
        res.data.data?.id ||
        res.data.id ||
        null;

      if (!requestId) {
        console.warn("ATS requestId not returned, using placeholder");
        requestId = "latest"; // fallback placeholder
      }

      // ===== Start recursive polling =====
      pollAtsStatus(requestId, 2); // first call after 2s
    } catch (err) {
      console.error(err);
      showToast(
        err?.response?.data?.msg || err.message || "ATS error",
        "error"
      );
      resetUI();
    }
  }

  // ===== Recursive Polling =====
async function pollAtsStatus(id, delaySeconds = 2) {
  try {
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

    pollCount++;
    pollCountElement.textContent = Math.min(pollCount * 10, 95) + "%";

    const res = await getAtsStatus(id);

    const atsStatus = res?.data?.data?.status?.toUpperCase();

    console.log("ATS STATUS:", atsStatus);

    // ✅ DONE or COMPLETED
  if (atsStatus === "DONE" || atsStatus === "COMPLETED") {
    pollingStatus.textContent = "Completed";
    pollCountElement.textContent = "100%";

    showToast("ATS analysis completed", "success");

    setTimeout(() => {
      window.location.href = "/ats.html";
    }, 500);

    return;
  }


    // ❌ FAILED
    if (atsStatus === "FAILED") {
      throw new Error(res?.data?.data?.lastError || "ATS failed");
    }

    // ⏳ Pending / Processing
    pollingStatus.textContent =
      atsStatus === "PENDING" ? "Pending..." : "Processing...";

    pollAtsStatus(id, 3);
  } catch (err) {
    showToast(err.message, "error");
    resetUI();
  }
}



  // ===== Reset UI =====
  function resetUI() {
    atsBtn.disabled = false;
    loadingPanel.classList.remove("active");
    apiStatus.textContent = "Idle";
    pollingStatus.textContent = "Stopped";
    pollCountElement.textContent = "0%";
    pollCount = 0;
  }

  atsBtn.addEventListener("click", startATSFlow);
});
