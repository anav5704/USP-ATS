import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import {
  INELIGIBLE_SCORE_CAP,
  MATCH_SCORE_WEIGHTS,
  computeEligibilityGates,
  computeScoreResult,
  scoreModelSchema,
} from "@/lib/applications/score-schema";
import {
  buildScorePrompt,
  type ScoringProfileInput,
} from "@/lib/applications/score-prompt";

// Opt-in: hits the live Gemini API (free tier, ~1.6K tokens per case).
// Run with: RUN_SCORING_LIVE_TESTS=1 pnpm tsx --test lib/applications/score-accuracy.test.ts
const LIVE = process.env.RUN_SCORING_LIVE_TESTS === "1";

const job = {
  title: "Teaching Assistant",
  department: "Computing Science",
  jobType: "Part-time",
  description:
    "Help run lab sessions for CS111, mark assignments, and hold weekly office hours.",
  gpaMin: 3.0,
  degree: ["Bachelor of Software Engineering"],
  skills: ["Python", "Communication"],
  hours: 10,
  campus: ["Laucala Campus"],
};

async function scoreApplicant(
  profile: ScoringProfileInput,
  coverLetter: string
) {
  const facts = computeEligibilityGates(
    { gpaMin: job.gpaMin, campus: job.campus },
    { degrees: profile.degrees, campuses: profile.campuses }
  );
  const { system, prompt } = buildScorePrompt(job, profile, coverLetter, facts);
  const { object } = await generateObject({
    model: google("gemini-3.6-flash"),
    schema: scoreModelSchema,
    temperature: 0,
    system,
    prompt,
  });
  return { facts, result: computeScoreResult(object, facts) };
}

const strongProfile: ScoringProfileInput = {
  skills: ["Python", "Tutoring", "Communication"],
  bio: "Second-year software engineering student.",
  degrees: [
    {
      name: "Bachelor of Software Engineering",
      gpa: 3.4,
      documentType: "TRANSCRIPT",
    },
  ],
  certificates: [{ label: "AWS Cloud Practitioner", organization: "Amazon" }],
  projectLinks: [
    { title: "Lab helper bot", url: "https://example.invalid/bot" },
  ],
  campuses: ["Laucala Campus"],
};

const weakProfile: ScoringProfileInput = {
  skills: ["Cooking"],
  bio: "First-year student looking for work.",
  degrees: [{ name: "Diploma of Hospitality", gpa: 2.5, documentType: "TRANSCRIPT" }],
  certificates: [],
  projectLinks: [],
  campuses: ["Laucala Campus"],
};

test(
  "accuracy: strong applicant scores high and eligible",
  { skip: !LIVE },
  async () => {
    const { result } = await scoreApplicant(
      strongProfile,
      "I am a second-year software engineering student who earned an A in CS111 last semester. I already help classmates debug Python in the lab and want to do it officially as a TA."
    );
    assert.equal(result.eligible, true);
    assert.ok(result.matchScore >= 75, `expected 75+, got ${result.matchScore}`);
    assert.deepEqual(result.missingRequirements, []);
    assert.ok(result.skillsScore >= 70);
    assert.ok(result.educationScore >= 70);
    assert.ok(result.motivationScore >= 70);
    // Overall is the weighted sum, not a model invention.
    assert.equal(
      result.matchScore,
      Math.round(
        result.skillsScore * MATCH_SCORE_WEIGHTS.skills +
          result.educationScore * MATCH_SCORE_WEIGHTS.education +
          result.motivationScore * MATCH_SCORE_WEIGHTS.motivation
      )
    );
  }
);

test(
  "accuracy: weak applicant scores low and ineligible with gaps listed",
  { skip: !LIVE },
  async () => {
    const { result } = await scoreApplicant(
      weakProfile,
      "I need a part-time job and I am a fast learner. Please consider me."
    );
    assert.equal(result.eligible, false);
    assert.ok(
      result.matchScore <= INELIGIBLE_SCORE_CAP,
      `expected capped at ${INELIGIBLE_SCORE_CAP}, got ${result.matchScore}`
    );
    assert.ok(result.missingRequirements.length > 0);
    assert.ok(result.missingRequirements.some((entry) => /GPA/i.test(entry)));
  }
);

test(
  "accuracy: campus mismatch makes a strong applicant ineligible",
  { skip: !LIVE },
  async () => {
    const { result } = await scoreApplicant(
      {
        ...strongProfile,
        degrees: [
          {
            name: "Bachelor of Software Engineering",
            gpa: 3.8,
            documentType: "DEGREE",
          },
        ],
        campuses: ["Labasa Campus"],
      },
      "I am a final-year software engineering student who earned an A in CS111. I already help classmates debug Python in the lab and want to do it officially as a TA."
    );
    assert.equal(result.eligible, false);
    assert.ok(
      result.matchScore <= INELIGIBLE_SCORE_CAP,
      `expected capped at ${INELIGIBLE_SCORE_CAP}, got ${result.matchScore}`
    );
    assert.ok(
      result.missingRequirements.some((entry) => /Labasa Campus/i.test(entry))
    );
  }
);
