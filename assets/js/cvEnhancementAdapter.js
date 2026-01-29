// cvEnhancementAdapter.js
export function mapBackendCvEnhancementToFrontend(d) {
  if (!d) return null;

  const lang = localStorage.getItem("lang") || "en";

  const audit = d.Audit || {};

  return {
    jobId: d.JobId,
    userId: d.UserId,
    status: d.Status,
    progress: d.ProgressPct,
    attempts: d.Attempts,
    createdAt: d.CreatedAtUtc,
    startedAt: d.StartedAtUtc,
    finishedAt: d.FinishedAtUtc,

    atsScore: audit.ats_score,
    atsVerdict: audit.verdict,
    parsabilityScore: audit.parsability_score,
    contentScore: audit.content_score,

    categoryScores: (audit.categories || []).map((c) => ({
      key: c.key,
      label: c.name?.[lang] || c.key,
      score: c.score,
    })),

    checks: (audit.checks || []).map((ch) => ({
      id: ch.id,
      categoryKey: ch.category_key,
      title: ch.title?.[lang] || ch.id,
      status: ch.status,
      severity: ch.severity,
      details: ch.details?.[lang] || "",
      fix: ch.fix?.[lang] || "",
    })),

    topIssues: (audit.top_issues || []).map((ti) => ti[lang] || ""),
    recommendations: (audit.recommendations || []).map((r) => r[lang] || ""),

    enhancedCv: d.EnhancedCv || {},
    enhancedDocxPath: d.EnhancedDocxPath,
    enhancedPdfPath: d.EnhancedPdfPath,
  };
}
