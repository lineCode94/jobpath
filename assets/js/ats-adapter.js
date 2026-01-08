// ats-adapter.js
export function mapBackendAtsToFrontend(apiResponse) {
const d = apiResponse?.data?.atsRes?.data;

  // console.log(d);
  if (!d) return null;

  return {
    // ===== IDs =====
    ResultId: d.ResultId,
    RequestId: d.RequestId,

    // ===== Scores =====
    OverallScore: d.OverallScore,
    TitleMatchScore: d.TitleMatchScore,
    SkillsScore: d.SkillsScore,
    ExperienceScore: d.ExperienceScore,
    EducationScore: d.EducationScore,
    CertificationsScore: d.CertificationsScore,
    KeywordDensityScore: d.KeywordDensityScore,

    // ===== Meta =====
    LanguageDetected: d.LanguageDetected,
    ExperienceLevel: d.ExperienceLevel,
    CreatedAtUtc: d.CreatedAtUtc,

    // ===== Skills =====
    MatchedSkillsJson: d.MatchedSkills || [],
    MissingSkillsJson: d.MissingSkills || [],

    // ===== Text blocks =====
    KeywordsSummary: d.KeywordsSummary,
    Summary: d.Summary,
    TopStrengths: d.TopStrengths,
    PrimaryRisk: d.PrimaryRisk,
    CareerPotentialAssessment: d.CareerPotentialAssessment,

    // ===== Recommendations =====
    RecommendationsJson: {
      JobProfileId: d.Recommendations?.JobProfileId,
      BuiltAtUtc: d.Recommendations?.BuiltAtUtc,
      MissingSkills: d.Recommendations?.MissingSkills || [],
      Certifications: d.Recommendations?.Certifications || [],
      Courses: d.Recommendations?.Courses || [],
      ActionPlan: d.Recommendations?.ActionPlan || {},
    },
  };
}

