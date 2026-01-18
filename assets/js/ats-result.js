import { getAtsResult } from "./api.js";
import { mapBackendAtsToFrontend } from "./ats-adapter.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const lang = localStorage.getItem("lang") || "en";

    // ===== Fetch ATS Result =====
    const apiRes = await getAtsResult();
    if (!apiRes?.data?.atsRes?.success) {
      console.error("Invalid ATS response structure");
      return;
    }

    const data = mapBackendAtsToFrontend(apiRes.data.atsRes.data);
    // console.log(data.scores);
    if (!data) return;

    // ===== Helper =====
    const textByLang = (el) => el?.dataset?.[lang] || el?.textContent || "";

    // ===== Update all headers with icons + language =====
    const defaultIcons = {
      "Overall Score": "fas fa-trophy",
      "Score Breakdown": "fas fa-chart-bar",
      "Matched Skills": "fas fa-check-circle",
      "Development Areas": "fas fa-exclamation-triangle",
      "Assessment Summary": "fas fa-file-alt",
      "Development Recommendations": "fas fa-graduation-cap",
      "Recommended Courses": "fas fa-book-open",
      "Development Action Plan": "fas fa-road",
      "Keywords Summary": "fas fa-key",
    };

    document.querySelectorAll("[data-en][data-ar]").forEach((el) => {
      const text = textByLang(el);
      let iconClass = el.dataset.icon;

      // لو مفيش icon في HTML ندي icon افتراضي حسب النص الإنجليزي
      if (!iconClass) {
        iconClass = defaultIcons[el.dataset.en] || "";
      }

      // ضع الأيقونة مع النص
      el.innerHTML = `<i class="${iconClass} me-2"></i> ${text}`;
    });

    // ===== Overall Score =====
    const overallScoreEl = document.getElementById("overallScoreEn");
    if (overallScoreEl)
      overallScoreEl.textContent = data.overallScore?.toFixed(1) || "0.0";

    // ===== Score Breakdown =====
    const breakdownEl = document.getElementById("scoreBreakdownEn");
    if (breakdownEl && Array.isArray(data.scores)) {
      breakdownEl.innerHTML = "";
if (breakdownEl && Array.isArray(data.scores)) {
  breakdownEl.innerHTML = ""; // reset

  data.scores.forEach((s) => {
    const scoreDiv = document.createElement("div");
    scoreDiv.className =
      "mb-2 d-flex justify-content-between align-items-center";

    // تحديد لون حسب القيمة
    let barColor =
       "#34d399"  ;

    scoreDiv.innerHTML = `
      <strong>${s.label}</strong>
      <div class="progress" style="flex:1; height:12px; border-radius:6px; background:#e5e7eb; margin-left:10px; margin-right:10px;">
        <div class="progress-bar" role="progressbar" style="width:0%; transition: width 1s ease-in-out; background:${barColor};">
          ${s.value.toFixed(1)}%
        </div>
      </div>
      <span class="score-value">${s.value.toFixed(1)}%</span>
    `;

    breakdownEl.appendChild(scoreDiv);

    // Animate
    const progressBar = scoreDiv.querySelector(".progress-bar");
    setTimeout(() => {
      progressBar.style.width = `${s.value}%`;
    }, 100);
  });
}


    }

    // ===== Skills =====
const renderSkills = (containerId, skills, type = "match") => {
  const container = document.getElementById(containerId);
  if (!container || !Array.isArray(skills)) return;

  container.innerHTML = skills
    .map((s) => {
      let badgeClass = "";
      if (type === "match") {
        badgeClass =
          s.MatchScore >= 85
            ? "match-high" // أخضر
            : s.MatchScore >= 70
              ? "match-medium" // أصفر
              : "match-low"; // أحمر
        return `
          <div class="p-2 border-bottom d-flex justify-content-between align-items-center">
            <div><strong>${s.SkillName}</strong><div class="small text-muted mt-1">${s.MatchType || ""}</div></div>
            <span class="match-badge ${badgeClass}">${s.MatchScore}%</span>
          </div>
        `;
      } else {
        badgeClass =
          s.Importance >= 8
            ? "importance-high" // أحمر
            : s.Importance >= 5
              ? "importance-medium" // أصفر
              : "importance-low"; // رمادي
        return `
          <div class="p-2 border-bottom d-flex justify-content-between align-items-center">
            <div><strong>${s.SkillName}</strong></div>
            <span class="importance-badge ${badgeClass}">Importance ${s.Importance}</span>
          </div>
        `;
      }
    })
    .join("");
};


    renderSkills("matchedSkillsEn", data.matchedSkills, "match");
    renderSkills("missingSkillsEn", data.missingSkills, "missing");

    // ===== Assessment Texts =====
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || "";
    };
    setText("summaryEn", data.summary);
    setText("topStrengthsEn", data.topStrengths);
    setText("primaryRiskEn", data.primaryRisk);
    setText("careerPotentialEn", data.careerPotential);

    // ===== Courses =====
    const coursesEl = document.getElementById("coursesEn");
    if (coursesEl && Array.isArray(data.courses)) {
      coursesEl.innerHTML = data.courses
        .map(
          (c) => `<div class="mb-3 p-2 border rounded">
                     <strong>${c.CourseTitle}</strong>
                     <div class="small text-muted">${c.Provider} · ${c.Hours}h · ${c.Level}</div>
                   </div>`,
        )
        .join("");
    }

    // ===== Action Plan =====
    const planEl = document.getElementById("actionPlanEn");
    if (planEl && data.actionPlan) {
      planEl.innerHTML = "";
      const plans = [
        {
          days: lang === "ar" ? "30 يوم" : "30 Days",
          text:
            lang === "ar"
              ? data.actionPlan.Plan30Days.Ar
              : data.actionPlan.Plan30Days.En,
          icon: data.actionPlan.Plan30Days.Icon || "fa-calendar-day",
        },
        {
          days: lang === "ar" ? "60 يوم" : "60 Days",
          text:
            lang === "ar"
              ? data.actionPlan.Plan60Days.Ar
              : data.actionPlan.Plan60Days.En,
          icon: data.actionPlan.Plan60Days.Icon || "fa-calendar-day",
        },
        {
          days: lang === "ar" ? "90 يوم" : "90 Days",
          text:
            lang === "ar"
              ? data.actionPlan.Plan90Days.Ar
              : data.actionPlan.Plan90Days.En,
          icon: data.actionPlan.Plan90Days.Icon || "fa-calendar-day",
        },
      ];

      plans.forEach((plan) => {
        const planHTML = `
          <div class="plan-item">
            <div class="plan-days">
              <i class="fas ${plan.icon}"></i>
              ${plan.days}
            </div>
            <div class="plan-text">${plan.text}</div>
          </div>
        `;
        planEl.innerHTML += planHTML;
      });
    }

    // ===== Keywords =====
    const keywordsEl = document.getElementById("keywordsEn");
    if (keywordsEl && data.keywords) {
      keywordsEl.innerHTML = "";
      data.keywords.split(",").forEach((k) => {
        let match = k.match(/(.*?) \((.*?)\)/);
        let display = match ? (lang === "ar" ? match[2] : match[1]) : k;
        const span = document.createElement("span");
        span.className = "badge bg-secondary me-1 mb-1";
        span.textContent = display.trim();
        keywordsEl.appendChild(span);
      });
    }
  } catch (err) {
    console.error("ATS load error:", err);
  }
});
