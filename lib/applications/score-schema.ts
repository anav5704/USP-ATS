import { z } from "zod";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";

// Ineligible applicants are capped here so rankings stay meaningful:
// 80-100 strong, 60-79 solid, 40-59 weak, 0-39 poor/ineligible.
export const INELIGIBLE_SCORE_CAP = 39;

// Fixed weights for the overall score. Deterministic in code so the math
// never drifts between runs.
export const MATCH_SCORE_WEIGHTS = {
  skills: 0.4,
  education: 0.3,
  motivation: 0.3,
} as const;

// What Gemini returns. Sub-scores are whole-number judgments; eligibility on
// GPA and campus is decided in code (see ScoringFacts) and only the degree
// requirement is left to the model.
export const scoreModelSchema = z.object({
  skillsScore: z.number().min(0).max(100),
  educationScore: z.number().min(0).max(100),
  motivationScore: z.number().min(0).max(100),
  meetsDegreeRequirement: z.boolean(),
  qualificationFit: z.string().trim().max(2000),
  motivationFit: z.string().trim().max(2000),
  missingRequirements: z
    .array(z.string().trim().min(1).max(300))
    .max(20),
});

export type ScoreModelOutput = z.infer<typeof scoreModelSchema>;

// Hard facts computed in code and handed to the model as decided inputs.
// Campus names are normalized (legacy short names map to canonical ones)
// because profile campuses are free-text strings.
export type ScoringFacts = {
  meetsGpaMinimum: boolean;
  meetsCampus: boolean;
  highestGpa: number | null;
  gpaMin: number | null;
  jobCampuses: string[];
  applicantCampuses: string[];
};

export function computeEligibilityGates(
  job: { gpaMin: number | null; campus: string[] },
  profile: { degrees: { gpa: number }[]; campuses: string[] }
): ScoringFacts {
  const highestGpa =
    profile.degrees.length > 0
      ? Math.max(...profile.degrees.map((degree) => degree.gpa))
      : null;
  const jobCampuses = job.campus.map(normalizeCampusCentre);
  const applicantCampuses = profile.campuses.map(normalizeCampusCentre);

  return {
    meetsGpaMinimum:
      job.gpaMin === null || (highestGpa !== null && highestGpa >= job.gpaMin),
    // Empty data fails open: never mark ineligible on missing fields alone.
    meetsCampus:
      jobCampuses.length === 0 ||
      applicantCampuses.length === 0 ||
      applicantCampuses.some((campus) => jobCampuses.includes(campus)),
    highestGpa,
    gpaMin: job.gpaMin,
    jobCampuses,
    applicantCampuses,
  };
}

export type ComputedScore = {
  matchScore: number;
  skillsScore: number;
  educationScore: number;
  motivationScore: number;
  eligible: boolean;
  missingRequirements: string[];
};

// Combines model judgment with the deterministic gates: rounds sub-scores,
// weights them into the overall score, ANDs all three eligibility signals,
// caps ineligible totals, and appends any gate failure the model omitted.
export function computeScoreResult(
  model: ScoreModelOutput,
  facts: ScoringFacts
): ComputedScore {
  const skillsScore = Math.round(model.skillsScore);
  const educationScore = Math.round(model.educationScore);
  const motivationScore = Math.round(model.motivationScore);
  const eligible =
    model.meetsDegreeRequirement && facts.meetsGpaMinimum && facts.meetsCampus;

  let matchScore = Math.round(
    skillsScore * MATCH_SCORE_WEIGHTS.skills +
      educationScore * MATCH_SCORE_WEIGHTS.education +
      motivationScore * MATCH_SCORE_WEIGHTS.motivation
  );
  if (!eligible && matchScore > INELIGIBLE_SCORE_CAP) {
    matchScore = INELIGIBLE_SCORE_CAP;
  }

  const missingRequirements = [...model.missingRequirements];
  if (
    !facts.meetsGpaMinimum &&
    facts.gpaMin !== null &&
    !missingRequirements.some((entry) => /\bgpa\b/i.test(entry))
  ) {
    missingRequirements.push(
      `Minimum GPA of ${facts.gpaMin.toFixed(2)} (highest degree GPA is ${facts.highestGpa === null ? "unlisted" : facts.highestGpa.toFixed(2)})`
    );
  }
  if (
    !facts.meetsCampus &&
    !missingRequirements.some((entry) => /campus|centre/i.test(entry))
  ) {
    missingRequirements.push(
      `Based at ${facts.applicantCampuses.join(", ")}; role is at ${facts.jobCampuses.join(", ")}`
    );
  }

  return {
    matchScore,
    skillsScore,
    educationScore,
    motivationScore,
    eligible,
    missingRequirements,
  };
}
