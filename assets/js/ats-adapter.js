// ats-adapter.js
export function mapBackendAtsToFrontend(d) {
  if (!d) return null;

  const lang = localStorage.getItem("lang") || "en";

  // Translation map for score labels
  const scoreLabels = {
    en: {
      titleMatch: "Title Match",
      skills: "Skills",
      experience: "Experience",
      education: "Education",
      certifications: "Certifications",
      keywordDensity: "Keyword Density",
    },
    ar: {
      titleMatch: "تطابق المسمى الوظيفي",
      skills: "المهارات",
      experience: "الخبرة",
      education: "التعليم",
      certifications: "الشهادات",
      keywordDensity: "كثافة الكلمات المفتاحية",
    },
  };

  return {
    overallScore: d.OverallScore,
    experienceLevel: d.ExperienceLevel,
    language: d.LanguageDetected,

    scores: [
      { label: scoreLabels[lang].titleMatch, value: d.TitleMatchScore },
      { label: scoreLabels[lang].skills, value: d.SkillsScore },
      { label: scoreLabels[lang].experience, value: d.ExperienceScore },
      { label: scoreLabels[lang].education, value: d.EducationScore },
      { label: scoreLabels[lang].certifications, value: d.CertificationsScore },
      { label: scoreLabels[lang].keywordDensity, value: d.KeywordDensityScore },
    ],

    matchedSkills: d.MatchedSkills || [],
    missingSkills: d.MissingSkills || [],

    summary: lang === "ar" ? d.SummaryAr : d.SummaryEn,
    topStrengths: lang === "ar" ? d.TopStrengthsAr : d.TopStrengthsEn,
    primaryRisk: lang === "ar" ? d.PrimaryRiskAr : d.PrimaryRiskEn,
    careerPotential:
      lang === "ar"
        ? d.CareerPotentialAssessmentAr
        : d.CareerPotentialAssessmentEn,

    keywords: d.KeywordsSummary || "",

    courses: d.Recommendations?.Courses || [],
    actionPlan: d.Recommendations?.ActionPlan || {},
  };
}
