// ats-result.js
import { getAtsResult } from "./api.js";
import { mapBackendAtsToFrontend } from "./ats-adapter.js";

let atsResultRow = null;

/* ==================== HELPERS ==================== */
function escapeHtml(str) {
  str = String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeText(v) {
  if (v === null || v === undefined) return "--";
  var s = String(v).trim();
  return s.length ? s : "--";
}

function pct(n) {
  var x = Number(n);
  if (!isFinite(x)) return "--";
  return x.toFixed(2) + "%";
}

function scoreLabel(score) {
  if (score >= 85) return { cls: "good", label: "Strong" };
  if (score >= 70) return { cls: "warn", label: "Moderate" };
  return { cls: "bad", label: "Weak" };
}

function showToast(message, type = "info") {
  console.log(message); // مؤقت – ممكن تستخدم Toastify لاحقاً
}

/* ==================== RENDER FUNCTIONS ==================== */

function setRing(score) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const val = Math.max(0, Math.min(100, Number(score) || 0));
  const dash = (val / 100) * c;
  const rest = c - dash;

  const ring = document.getElementById("ringStroke");
  if (!ring) return;
  ring.setAttribute("stroke-dasharray", `${dash} ${rest}`);

  let stroke = "rgba(47,179,90,.95)";
  if (val < 70) stroke = "rgba(52, 168, 83,.92)";
  ring.setAttribute("stroke", stroke);

  const overallEl = document.getElementById("overallScore");
  if (overallEl) overallEl.textContent = val.toFixed(2);
}

function renderBars() {
  const lang = localStorage.getItem("lang") || "en";
const bars = [
  { name: lang === "ar" ? "تطابق المسمّى الوظيفي" : "Title Match", value: atsResultRow.TitleMatchScore },
  { name: lang === "ar" ? "المهارات" : "Skills", value: atsResultRow.SkillsScore },
  { name: lang === "ar" ? "الخبرة" : "Experience", value: atsResultRow.ExperienceScore },
  { name: lang === "ar" ? "التعليم" : "Education", value: atsResultRow.EducationScore },
  { name: lang === "ar" ? "الشهادات" : "Certifications", value: atsResultRow.CertificationsScore },
  { name: lang === "ar" ? "كثافة الكلمات المفتاحية" : "Keyword Density", value: atsResultRow.KeywordDensityScore },
];


  const host = document.getElementById("scoreBars");
  if (!host) return;
  host.innerHTML = "";

  bars.forEach((b) => {
    const val = Math.max(0, Math.min(100, Number(b.value) || 0));
    const info = scoreLabel(val);

    const row = document.createElement("div");
    row.className = "bar";
    row.innerHTML = `
      <div class="barTop">
        <div>${escapeHtml(b.name)}</div>
        <div class="pct">
          <span class="tag ${info.cls}">${escapeHtml(info.label)}</span>
          <span>${escapeHtml(pct(val))}</span>
        </div>
      </div>
      <div class="track"><div class="fill ${
        info.cls === "warn" ? "warn" : info.cls === "bad" ? "bad" : ""
      }" style="width:${val}%"></div></div>
    `;
    host.appendChild(row);
  });

  // Animate bars
  setTimeout(() => {
    const fills = host.querySelectorAll(".fill");
    fills.forEach((f) => {
      const w = f.style.width;
      f.style.width = "0%";
      setTimeout(() => {
        f.style.width = w;
      }, 30);
    });
  }, 10);
}

function renderMeta() {
  const pills = [
    { k: "ResultId", v: atsResultRow.ResultId },
    { k: "RequestId", v: atsResultRow.RequestId },
    { k: "Language", v: atsResultRow.LanguageDetected },
    { k: "Level", v: atsResultRow.ExperienceLevel },
    { k: "Created", v: atsResultRow.CreatedAtUtc },
  ];
  const host = document.getElementById("metaPills");
  if (!host) return;
  host.innerHTML = "";
  pills.forEach((p) => {
    const el = document.createElement("div");
    el.className = "pill";
    el.innerHTML = `<span class="k">${escapeHtml(
      p.k
    )}</span><span class="v">${escapeHtml(p.v)}</span>`;
    host.appendChild(el);
  });
}

function renderNarrative() {
  [
    "Summary",
    "TopStrengths",
    "PrimaryRisk",
    "CareerPotentialAssessment",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el && atsResultRow[id]) el.textContent = safeText(atsResultRow[id]);
  });

  const host = document.getElementById("KeywordsChips");
  if (!host) return;
  host.innerHTML = "";
  const parts = (atsResultRow.KeywordsSummary || "").split(",");
  const clean = parts.map((s) => s.trim()).filter((s) => s.length);
  if (!clean.length) {
    const empty = document.createElement("div");
    empty.className = "chip";
    empty.textContent = "--";
    host.appendChild(empty);
  } else {
    clean.forEach((k) => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = k;
      host.appendChild(chip);
    });
  }
}

function renderMatchedSkills() {
  const tbody = document.getElementById("MatchedSkillsTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const list = Array.isArray(atsResultRow.MatchedSkillsJson)
    ? atsResultRow.MatchedSkillsJson
    : [];
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="4">--</td></tr>';
    return;
  }
  list.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(
        s.SkillName
      )}<div class="tag info" style="margin:6px;">SkillId: <span class="mono">${escapeHtml(
      s.SkillId
    )}</span></div></td>
      <td class="mono">${escapeHtml(s.MatchScore)}</td>
      <td>${escapeHtml(s.MatchType)}</td>
      <td class="mono">${escapeHtml(s.Weight)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMissingSkills() {
  const tbody = document.getElementById("MissingSkillsTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const list = Array.isArray(atsResultRow.MissingSkillsJson)
    ? atsResultRow.MissingSkillsJson
    : [];
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="2">--</td></tr>';
    return;
  }
  list.forEach((s) => {
    let cls = "info";
    const imp = Number(s.Importance) || 0;
    if (imp >= 9) cls = "bad";
    else if (imp >= 7) cls = "warn";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(
        s.SkillName
      )}<div class="tag info" style="margin:6px;">SkillId: <span class="mono">${escapeHtml(
      s.SkillId
    )}</span></div></td>
      <td><span class="tag ${cls}">Importance: <span class="mono">${escapeHtml(
      s.Importance
    )}</span></span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCerts() {
  const tbody = document.getElementById("CertsTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const certs = atsResultRow.RecommendationsJson?.Certifications || [];
  if (!certs.length) {
    tbody.innerHTML = '<tr><td colspan="5">--</td></tr>';
    return;
  }
  certs.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(
        c.Name
      )}<div class="tag info" style="margin-top:6px;">CertificationId: <span class="mono">${escapeHtml(
      c.CertificationId
    )}</span></div></td>
      <td>${escapeHtml(c.Provider)}</td>
      <td>${escapeHtml(c.Level)}</td>
      <td class="mono">${escapeHtml(c.Hours)}</td>
      <td class="mono">${escapeHtml(c.Priority)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCourses() {
  const tbody = document.getElementById("CoursesTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const courses = atsResultRow.RecommendationsJson?.Courses || [];
  if (!courses.length) {
    tbody.innerHTML = '<tr><td colspan="5">--</td></tr>';
    return;
  }
  courses.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        ${escapeHtml(c.CourseTitle)}
        <div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap;">
          <span class="tag info">CourseId: <span class="mono">${escapeHtml(
            c.CourseId
          )}</span></span>
          <span class="tag info">SkillId: <span class="mono">${escapeHtml(
            c.SkillId
          )}</span></span>
        </div>
      </td>
      <td>${escapeHtml(c.Provider)}</td>
      <td>${escapeHtml(c.Level)}</td>
      <td class="mono">${escapeHtml(c.Hours)}</td>
      <td class="mono">${escapeHtml(c.Priority)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderActionPlan() {
  const ap = atsResultRow.RecommendationsJson?.ActionPlan || {};
  ["Plan30Days", "Plan60Days", "Plan90Days"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = safeText(ap[id]);
  });
}

function renderOverallScoreUI() {
  const el = document.getElementById("overallScore");
  if (el) el.textContent = safeText(atsResultRow.OverallScore);
}

/* ==================== INIT ==================== */
function init() {
  document.querySelector("#resultCard")?.classList.remove("d-none");

  // Render UI
  renderMeta();
  renderOverallScoreUI();
  setRing(atsResultRow.OverallScore);
  renderBars();
  renderNarrative();
  renderMatchedSkills();
  renderMissingSkills();
  renderCerts();
  renderCourses();
  renderActionPlan();

  const copyBtn = document.getElementById("btnCopyJson");
  if (copyBtn)
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(JSON.stringify(atsResultRow, null, 2));
      showToast("✅ JSON copied to clipboard", "info");
    });
}

/* ==================== STATES ==================== */
function showEmptyState() {
  document.querySelector("#resultCard")?.classList.add("d-none");
  document.querySelector("#emptyState")?.classList.remove("d-none");
}

function showErrorState() {
  showToast("⚠️ Failed to load ATS result", "error");
}

/* ==================== DATA LOADER ==================== */
async function loadAtsResult() {
  try {
    const apiResponse = await getAtsResult();
    atsResultRow = mapBackendAtsToFrontend(apiResponse);

    if (!atsResultRow) {
      showEmptyState();
      return;
    }

    init();
  } catch (err) {
    console.error(err);
    showErrorState();
  }
}

document.addEventListener("DOMContentLoaded", loadAtsResult);
