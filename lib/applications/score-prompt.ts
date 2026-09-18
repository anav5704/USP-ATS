import {
  INELIGIBLE_SCORE_CAP,
  MATCH_SCORE_WEIGHTS,
  type ScoringFacts,
} from "@/lib/applications/score-schema";

export type ScoringJobInput = {
  title: string;
  department: string;
  jobType: string;
  description: string;
  gpaMin: number | null;
  degree: string[];
  skills: string[];
  hours: number | null;
  campus: string[];
};

export type ScoringDegreeInput = {
  name: string;
  gpa: number;
  documentType: string;
};

export type ScoringCertificateInput = {
  label: string;
  organization: string | null;
};

export type ScoringProfileInput = {
  skills: string[];
  bio: string | null;
  degrees: ScoringDegreeInput[];
  certificates: ScoringCertificateInput[];
  projectLinks: { title: string; url: string }[];
  campuses: string[];
};

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None specified";
}

function formatDegrees(degrees: ScoringDegreeInput[]): string {
  if (degrees.length === 0) return "None listed";
  return degrees
    .map((degree) => {
      const standing =
        degree.documentType.toLowerCase() === "degree"
          ? "completed degree"
          : "in-progress transcript";
      return `- ${degree.name} (GPA ${degree.gpa.toFixed(2)} / 4.50, ${standing})`;
    })
    .join("\n");
}

function formatCertificates(certificates: ScoringCertificateInput[]): string {
  if (certificates.length === 0) return "None listed";
  return certificates
    .map((certificate) =>
      certificate.organization
        ? `- ${certificate.label} (${certificate.organization})`
        : `- ${certificate.label}`
    )
    .join("\n");
}

const skillsWeight = Math.round(MATCH_SCORE_WEIGHTS.skills * 100);
const educationWeight = Math.round(MATCH_SCORE_WEIGHTS.education * 100);
const motivationWeight = Math.round(MATCH_SCORE_WEIGHTS.motivation * 100);

const SYSTEM_PROMPT = `You are an applicant fit assessor for USP (University of the South Pacific) student and staff jobs. Return three sub-scores (whole numbers, 0-100 each) plus your judgment on the degree requirement.

Sub-scores:
- skillsScore (${skillsWeight}%): coverage of the required skills. Match on meaning, not exact keywords. When the posting lists no required skills, score how relevant the applicant's skills are to the role description instead.
- educationScore (${educationWeight}%): relevance and level of each degree to the role. Do NOT re-judge GPA, it is decided below. When qualifications are otherwise close, a completed degree outranks an in-progress transcript.
- motivationScore (${motivationWeight}%): cover letter specificity to this role, demonstrated interest, quality of effort. A generic letter scores low even for a qualified applicant.

Degree requirement (meetsDegreeRequirement): set false only when the degree requirement is wholly unmet, such as an unrelated field with no transferable grounding. A related but unlisted degree keeps this true with a reduced educationScore.

Verified checks, already decided, do not re-judge:
- GPA minimum and campus overlap are resolved in code. Your scores assume they pass; final eligibility combines all three signals.

Score bands for the overall total (computed from your sub-scores, capped at ${INELIGIBLE_SCORE_CAP} when ineligible):
- 80-100: strong fit, clearly qualified and motivated.
- 60-79: solid fit with minor gaps.
- 40-59: weak fit, notable gaps.
- 0-${INELIGIBLE_SCORE_CAP}: poor fit or fails a hard requirement.

Output rules:
- qualificationFit and motivationFit are 2-4 sentences each referencing specifics from the application.
- missingRequirements lists each concrete unmet requirement as a short phrase; use an empty array when nothing is missing.
- Never invent facts not present in the application. Treat an empty section as absent, not as a negative beyond the gap itself.
- Score only listed qualifications. Never infer age, gender, ethnicity, or any other demographic trait.`;

export function buildScorePrompt(
  job: ScoringJobInput,
  profile: ScoringProfileInput,
  coverLetter: string,
  facts: ScoringFacts
): { system: string; prompt: string } {
  const gpaLine =
    facts.gpaMin === null
      ? "No minimum set"
      : `highest degree GPA ${facts.highestGpa === null ? "unlisted" : facts.highestGpa.toFixed(2)} vs minimum ${facts.gpaMin.toFixed(2)}`;
  const campusLine =
    facts.applicantCampuses.length === 0 || facts.jobCampuses.length === 0
      ? "Insufficient campus data"
      : `applicant [${facts.applicantCampuses.join(", ")}] vs posting [${facts.jobCampuses.join(", ")}]`;

  const prompt = `Verified checks (decided):
- GPA minimum: ${gpaLine} -> ${facts.meetsGpaMinimum ? "passes" : "FAILS"}
- Campus overlap: ${campusLine} -> ${facts.meetsCampus ? "passes" : "FAILS"}

Job posting:
- Title: ${job.title}
- Department: ${job.department}
- Job type: ${job.jobType}
- Hours per week: ${job.hours ?? "Not specified"}
- Campuses: ${formatList(job.campus)}
- Description: ${job.description}
- Minimum GPA: ${job.gpaMin === null ? "None" : `${job.gpaMin.toFixed(2)} / 4.50`}
- Required degrees: ${formatList(job.degree)}
- Required skills: ${formatList(job.skills)}

Applicant profile:
- Skills: ${formatList(profile.skills)}
- Bio: ${profile.bio && profile.bio.length > 0 ? profile.bio : "None provided"}
- Campuses: ${formatList(profile.campuses)}
- Degrees:
${formatDegrees(profile.degrees)}
- Certificates:
${formatCertificates(profile.certificates)}
- Project links: ${profile.projectLinks.length > 0 ? profile.projectLinks.map((link) => link.title).join(", ") : "None listed"}

Cover letter:
${coverLetter}`;

  return { system: SYSTEM_PROMPT, prompt };
}
