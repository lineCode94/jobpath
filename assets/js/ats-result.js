// ats-result.js
import { getAtsResult } from "./api.js";
// ⚠️ API بيرجع LATEST ATS RESULT — توكين فقط

const POLL_INTERVAL = 4000; // 4 seconds
let pollingTimer = null;

/* ================= Helpers ================= */

function formatScore(value) {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  return isNaN(num) ? value : num.toFixed(2);
}

function setBar(barElement, value, max = 100) {
  if (!barElement) return;
  const v = Number(value);
  const percent = isNaN(v) ? 0 : Math.min(Math.max(v, 0), max);
  barElement.style.width = percent + "%";
  barElement.setAttribute("aria-valuenow", percent.toString());
}

function showLoadingState() {
  document.getElementById("resultCard")?.classList.add("d-none");
  document.getElementById("rawJsonCard")?.classList.add("d-none");

  if (!document.getElementById("atsLoading")) {
    const div = document.createElement("div");
    div.id = "atsLoading";
    div.className = "text-center mt-5 text-secondary";
    div.innerHTML = `
      <div class="spinner-border text-success mb-3"></div>
      <div>Analyzing your CV, please wait...</div>
    `;
    document.querySelector(".page-wrapper")?.prepend(div);
  }
}

function hideLoadingState() {
  document.getElementById("atsLoading")?.remove();
}

/* ================= Render ================= */

function renderResult(ats) {
  hideLoadingState();
const lang = localStorage.getItem("lang") || "en";
  document.getElementById("lblRequestId").textContent = ats.requestId ?? "-";
  document.getElementById("lblLanguage").textContent = lang || "-";

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

  document.getElementById("lblKeywordDensity").textContent =
    ats.keywordDensityScore != null
      ? ats.keywordDensityScore.toFixed(2) + " %"
      : "N/A";

  document.getElementById("lblExperienceLevel").textContent =
    ats.experienceLevel || "-";

  // Progress bars
  setBar(document.getElementById("barSkillsScore"), ats.skillsScore);
  setBar(document.getElementById("barTitleScore"), ats.titleMatchScore);
  setBar(document.getElementById("barEducationScore"), ats.educationScore);
  setBar(document.getElementById("barCertScore"), ats.certificationsScore);
  setBar(
    document.getElementById("barKeywordDensity"),
    ats.keywordDensityScore ? ats.keywordDensityScore * 5 : 0
  );

  // Matched skills
  const matched = document.getElementById("matchedSkillsList");
  matched.innerHTML = "";
  ats.matchedSkills?.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${s.SkillName}</strong> – ${s.MatchScore}%`;
    matched.appendChild(li);
  });

  // Missing skills
  const missing = document.getElementById("missingSkillsList");
  missing.innerHTML = "";
  ats.missingSkills?.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s.SkillName;
    missing.appendChild(li);
  });

  // document.getElementById("lblSummary").textContent = ats.summary || "-";
  document.getElementById("lblKeywordsSummary").textContent =
    ats.keywordsSummary || "-";

 

  document.getElementById("resultCard").classList.remove("d-none");
  // document.getElementById("rawJsonCard").classList.remove("d-none");
}

/* ================= Logic ================= */

async function loadAtsResult() {
  try {
    const res = await getAtsResult();
    const ats = res?.data?.atsRes;

    console.log("ATS RESPONSE:", ats);

    // ✅ أول ما النتيجة موجودة نعرضها فورًا
    if (ats?.overallScore != null) {
      clearInterval(pollingTimer);
      renderResult(ats);
      return;
    }

    // ⏳ لسه مفيش نتيجة
    showLoadingState();
  } catch (e) {
    console.error("ATS RESULT ERROR:", e);
  }
}

/* ================= Init ================= */

document.addEventListener("DOMContentLoaded", () => {
  showLoadingState();
  loadAtsResult();
  pollingTimer = setInterval(loadAtsResult, POLL_INTERVAL);
});
