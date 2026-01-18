// ats-result.js
import { getAtsResult } from "./api.js";
import { mapBackendAtsToFrontend } from "./ats-adapter.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // ===== Fetch ATS Result =====
    const apiRes = await getAtsResult();
    console.log("ATS RAW RESPONSE:", apiRes);

    if (!apiRes?.data?.atsRes?.success) {
      console.error("Invalid ATS response structure");
      return;
    }

    // 👈 المهم: ابعت الداتا الصح للـ adapter
    const data = mapBackendAtsToFrontend(apiRes.data.atsRes.data);
    console.log(data);
    if (!data) return;

    // ===== Overall Score =====
    const overallScoreEl = document.getElementById("overallScoreEn");
    if (overallScoreEl) {
      overallScoreEl.textContent = data.overallScore
        ? data.overallScore.toFixed(1)
        : "0.0";
    }

    // ===== Score Breakdown =====
    const breakdown = document.getElementById("scoreBreakdownEn");
    if (breakdown && Array.isArray(data.scores)) {
      breakdown.innerHTML = "";
      data.scores.forEach((s) => {
        breakdown.innerHTML += `
          <div class="mb-2">
            <strong>${s.label}</strong>
            <div class="progress">
              <div class="progress-bar bg-success" style="width:${s.value}%">
                ${s.value}%
              </div>
            </div>
          </div>
        `;
      });
    }

    // ===== Matched Skills =====
    const matched = document.getElementById("matchedSkillsEn");
    if (matched && Array.isArray(data.matchedSkills)) {
      matched.innerHTML = data.matchedSkills
        .map(
          (s) => `
          <div class="p-2 border-bottom">
            <strong>${s.SkillName}</strong>
            <div class="text-muted small">
              Match: ${s.MatchScore}% – ${s.MatchType}
            </div>
          </div>
        `,
        )
        .join("");
    }

    // ===== Missing Skills =====
    const missing = document.getElementById("missingSkillsEn");
    if (missing && Array.isArray(data.missingSkills)) {
      missing.innerHTML = data.missingSkills
        .map(
          (s) => `
          <div class="p-2 border-bottom">
            <strong>${s.SkillName}</strong>
            <span class="badge bg-warning ms-2">
              Importance ${s.Importance}
            </span>
          </div>
        `,
        )
        .join("");
    }

    // ===== Text Sections =====
    const summaryEl = document.getElementById("summaryEn");
    if (summaryEl) summaryEl.textContent = data.summary || "";

    const strengthsEl = document.getElementById("topStrengthsEn");
    if (strengthsEl) strengthsEl.textContent = data.topStrengths || "";

    const riskEl = document.getElementById("primaryRiskEn");
    if (riskEl) riskEl.textContent = data.primaryRisk || "";

    const careerEl = document.getElementById("careerPotentialEn");
    if (careerEl) careerEl.textContent = data.careerPotential || "";

    // ===== Courses =====
    const coursesEl = document.getElementById("coursesEn");
    if (coursesEl && Array.isArray(data.courses)) {
      coursesEl.innerHTML = data.courses
        .map(
          (c) => `
          <div class="mb-3">
            <strong>${c.CourseTitle}</strong>
            <div class="small text-muted">
              ${c.Provider} · ${c.Hours}h · ${c.Level}
            </div>
          </div>
        `,
        )
        .join("");
    }

    // ===== Action Plan =====
    const planEl = document.getElementById("actionPlanEn");
    if (planEl && data.actionPlan) {
      planEl.innerHTML = `
        <div><strong>30 Days:</strong> ${data.actionPlan.Plan30Days?.En || ""}</div>
        <div><strong>60 Days:</strong> ${data.actionPlan.Plan60Days?.En || ""}</div>
        <div><strong>90 Days:</strong> ${data.actionPlan.Plan90Days?.En || ""}</div>
      `;
    }

    // ===== Keywords =====
    const keywordsEl = document.getElementById("keywordsEn");
    if (keywordsEl && typeof data.keywords === "string") {
      keywordsEl.innerHTML = data.keywords
        .split(",")
        .map(
          (k) =>
            `<span class="badge bg-secondary me-1 mb-1">${k.trim()}</span>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("ATS load error:", err);
  }
});
