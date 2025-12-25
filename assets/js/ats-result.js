// ats-result.js
import { getAtsResult } from "./api.js"; // استيراد الدالة من api.js

// ====== Helpers ======
function formatScore(value) {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  if (isNaN(num)) return value.toString();
  return num.toFixed(2);
}

function setBar(barElement, value, maxPercent = 100) {
  if (!barElement) return;
  if (value === null || value === undefined) {
    barElement.style.width = "0%";
    barElement.setAttribute("aria-valuenow", "0");
    return;
  }
  const percent = Math.max(0, Math.min(Number(value), maxPercent));
  barElement.style.width = percent + "%";
  barElement.setAttribute("aria-valuenow", percent.toString());
}

function setStatusBadge(element, status) {
  if (!element) return;
  element.className = "badge-status";
  const s = (status || "").toLowerCase();
  if (s === "done" || s === "completed") {
    element.classList.add("bg-success");
    element.textContent = "Completed";
  } else if (s === "processing" || s === "pending") {
    element.classList.add("bg-info");
    element.textContent = "Processing";
  } else if (s === "failed") {
    element.classList.add("bg-danger");
    element.textContent = "Failed";
  } else {
    element.classList.add("bg-secondary");
    element.textContent = status || "Unknown";
  }
}

function renderResult(data) {
  const ats = data.atsRes;
  if (!ats) return;

  document.getElementById("lblRequestId").textContent = ats.requestId ?? "";
  document.getElementById("lblUserId").textContent = ats.userId ?? "";
  document.getElementById("lblLanguage").textContent =
    ats.languageDetected || "-";

  document.getElementById("lblCreatedAt").textContent = ats.createdAtUtc
    ? new Date(ats.createdAtUtc).toLocaleString()
    : "N/A";
  document.getElementById("lblCompletedAt").textContent = ats.completedAtUtc
    ? new Date(ats.completedAtUtc).toLocaleString()
    : "N/A";

  setStatusBadge(
    document.getElementById("lblStatusBadge"),
    ats.status ?? "Completed"
  );

  // Scores
  document.getElementById("lblOverallScore").textContent = formatScore(
    ats.overallScore
  );
  document.getElementById("lblSkillsScore").textContent = formatScore(
    ats.skillsScore
  );
  document.getElementById("lblTitleScore").textContent = formatScore(
    ats.titleMatchScore
  );
  document.getElementById("lblEducationScore").textContent = formatScore(
    ats.educationScore
  );
  document.getElementById("lblCertScore").textContent = formatScore(
    ats.certificationsScore
  );

  const kd = ats.keywordDensityScore;
  document.getElementById("lblKeywordDensity").textContent =
    kd != null ? kd.toFixed(2) + " %" : "N/A";
  document.getElementById("lblExperienceLevel").textContent =
    ats.experienceLevel || "-";

  // Progress bars
  setBar(document.getElementById("barSkillsScore"), ats.skillsScore);
  setBar(document.getElementById("barTitleScore"), ats.titleMatchScore);
  setBar(document.getElementById("barEducationScore"), ats.educationScore);
  setBar(document.getElementById("barCertScore"), ats.certificationsScore);
  setBar(
    document.getElementById("barKeywordDensity"),
    kd != null ? Math.min(kd * 5, 100) : 0
  );

  // Skills
  const matchedList = document.getElementById("matchedSkillsList");
  const missingList = document.getElementById("missingSkillsList");
  matchedList.innerHTML = "";
  missingList.innerHTML = "";

  if (ats.matchedSkills && ats.matchedSkills.length > 0) {
    ats.matchedSkills.forEach((s) => {
      const li = document.createElement("li");
      li.innerHTML =
        `<strong>${s.SkillName}</strong>` +
        (s.MatchScore ? ` � match ${formatScore(s.MatchScore)}` : "") +
        (s.MatchType ? ` (${s.MatchType})` : "");
      matchedList.appendChild(li);
    });
  } else matchedList.innerHTML = "<li>No matched skills found.</li>";

  if (ats.missingSkills && ats.missingSkills.length > 0) {
    ats.missingSkills.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s.SkillName || JSON.stringify(s);
      missingList.appendChild(li);
    });
  } else missingList.innerHTML = "<li>No missing/recommended skills.</li>";

  // Summary
  document.getElementById("lblSummary").textContent = ats.summary || "-";
  document.getElementById("lblKeywordsSummary").textContent =
    ats.keywordsSummary || "-";

  // Raw JSON
  document.getElementById("rawJsonBox").textContent = JSON.stringify(
    ats,
    null,
    2
  );
  document.getElementById("rawJsonCard").classList.remove("d-none");
  document.getElementById("resultCard").classList.remove("d-none");
}

// ======= Get requestId from URL and load result =======
const urlParams = new URLSearchParams(window.location.search);
const requestId = urlParams.get("id"); // URL example: ats.html?id=16

if (requestId) {
  getAtsResult(requestId)
    .then((data) => renderResult(data))
    .catch((err) => console.error("Failed to load ATS result:", err));
} else {
  console.warn("No requestId provided in URL.");
}
