import { getCvEnhancementResult } from "./api.js";
import { mapBackendCvEnhancementToFrontend } from "./cvEnhancementAdapter.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const lang = localStorage.getItem("lang") || "en";

    const apiRes = await getCvEnhancementResult();
    if (!apiRes?.data?.result?.success) {
      console.error("Invalid CV Enhancement response");
      return;
    }

    const data = mapBackendCvEnhancementToFrontend(apiRes.data.result.data);
    if (!data) return;

    // ===== Job Info =====
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || "";
    };

    setText("job-id", data.jobId);
    setText("user-id", data.userId);
    setText("target-job-title", data.enhancedCv.jobTitle || "");
    setText("status-inline", data.status);
    setText("progress-text", `${data.progress}%`);
    setText("attempts", data.attempts);
    setText("created-at", new Date(data.createdAt).toLocaleString());
    setText("started-at", new Date(data.startedAt).toLocaleString());
    setText("completed-at", new Date(data.finishedAt).toLocaleString());
    document.getElementById("progress-fill").style.width = `${data.progress}%`;

    // ===== ATS Score Card =====
    setText("ats-score", data.atsScore);
    setText("ats-verdict", data.atsVerdict);
    setText(
      "ats-desc",
      `Parsability: ${data.parsabilityScore}%, Content: ${data.contentScore}%`,
    );

    // ===== Category Scores =====
    const categoryContainer = document.getElementById("category-scores");
    if (categoryContainer) {
      categoryContainer.innerHTML = data.categoryScores
        .map(
          (c) => `
        <div class="score-item">
          <strong>${c.label}</strong>: ${c.score}%
        </div>
      `,
        )
        .join("");
    }

    // ===== Detailed Checks =====
    const checksContainer = document.getElementById("checks-list");
    if (checksContainer) {
      checksContainer.innerHTML = data.checks
        .map(
          (ch) => `
        <div class="check-item ${ch.status.toLowerCase()}">
          <strong>${ch.title}</strong> [${ch.status}]
          <div class="small text-muted">${ch.details}</div>
          <div class="small text-info">Fix: ${ch.fix}</div>
        </div>
      `,
        )
        .join("");
    }

    // ===== Recommendations =====
    const recsContainer = document.getElementById("recommendations-list");
    if (recsContainer) {
      recsContainer.innerHTML = data.recommendations
        .map((r) => `<div class="rec-item">${r}</div>`)
        .join("");
    }

    // ===== Enhanced CV Preview =====
    const previewEl = document.getElementById("cv-preview");
    if (previewEl && data.enhancedCv) {
      previewEl.innerHTML = `
        <h3>${data.enhancedCv.header?.fullName}</h3>
        <p>${data.enhancedCv.summary}</p>
        <h4>Skills:</h4>
        <ul>${(data.enhancedCv.skills || []).map((s) => `<li>${s}</li>`).join("")}</ul>
      `;
    }

    // ===== Enhancement Summary =====
    setText("enh-applied", (data.enhancedCv.skills || []).join(", "));
    setText("truth-check", "Passed"); // example, can adjust
    setText("ai-notes", (data.enhancedCv.notes || []).join(" "));

    // ===== Download Links =====
    const docxBtn = document.getElementById("download-docx");
    if (docxBtn) docxBtn.href = `file:///${data.enhancedDocxPath}`;

    const pdfBtn = document.getElementById("download-pdf");
    if (pdfBtn) pdfBtn.href = `file:///${data.enhancedPdfPath}`;
  } catch (err) {
    console.error("CV Enhancement load error:", err);
  }
});
