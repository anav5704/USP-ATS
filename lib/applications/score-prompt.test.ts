import assert from "node:assert/strict";
import test from "node:test";
import {
  INELIGIBLE_SCORE_CAP,
  computeEligibilityGates,
  computeScoreResult,
  scoreModelSchema,
  type ScoreModelOutput,
} from "@/lib/applications/score-schema";
import {
  buildScorePrompt,
  type ScoringJobInput,
  type ScoringProfileInput,
} from "@/lib/applications/score-prompt";

const job: ScoringJobInput = {
  title: "Teaching Assistant",
  department: "Computing Science",
  jobType: "Part-time",
  description: "Help run lab sessions for CS111.",
  gpaMin: 3.0,
  degree: ["Bachelor of Software Engineering"],
  skills: ["Python", "Communication"],
  hours: 10,
  campus: ["Laucala Campus"],
};

const profile: ScoringProfileInput = {
  skills: ["Python", "Tutoring"],
  bio: "Second-year software engineering student.",
  degrees: [{ name: "Bachelor of Software Engineering", gpa: 3.4, documentType: "TRANSCRIPT" }],
  certificates: [{ label: "AWS Cloud Practitioner", organization: "Amazon" }],
  projectLinks: [{ title: "Lab helper bot", url: "https://example.invalid/bot" }],
  campuses: ["Laucala Campus"],
};

function modelOutput(overrides: Partial<ScoreModelOutput> = {}): ScoreModelOutput {
  return {
    skillsScore: 90,
    educationScore: 85,
    motivationScore: 80,
    meetsDegreeRequirement: true,
    qualificationFit: "Strong skill overlap.",
    motivationFit: "Specific to the role.",
    missingRequirements: [],
    ...overrides,
  };
}

function gates() {
  return computeEligibilityGates(
    { gpaMin: job.gpaMin, campus: job.campus },
    {
      degrees: profile.degrees,
      campuses: profile.campuses,
    }
  );
}

test("model schema accepts sub-scores and degree judgment", () => {
  assert.equal(scoreModelSchema.safeParse(modelOutput()).success, true);
});

test("model schema rejects out-of-range sub-scores", () => {
  assert.equal(
    scoreModelSchema.safeParse(modelOutput({ skillsScore: 120 })).success,
    false
  );
});

test("gates pass when GPA clears and campuses overlap", () => {
  const facts = gates();
  assert.equal(facts.meetsGpaMinimum, true);
  assert.equal(facts.meetsCampus, true);
  assert.equal(facts.highestGpa, 3.4);
});

test("gates normalize legacy campus names before comparing", () => {
  const facts = computeEligibilityGates(
    { gpaMin: null, campus: ["Laucala Campus"] },
    { degrees: [], campuses: ["Laucala"] }
  );
  assert.equal(facts.meetsCampus, true);
  assert.deepEqual(facts.applicantCampuses, ["Laucala Campus"]);
});

test("gates fail on disjoint campuses and low GPA", () => {
  const facts = computeEligibilityGates(
    { gpaMin: 3.0, campus: ["Laucala Campus"] },
    { degrees: [{ gpa: 2.5 }], campuses: ["Labasa Campus"] }
  );
  assert.equal(facts.meetsGpaMinimum, false);
  assert.equal(facts.meetsCampus, false);
});

test("gates fail open on missing data", () => {
  const facts = computeEligibilityGates(
    { gpaMin: null, campus: [] },
    { degrees: [], campuses: [] }
  );
  assert.equal(facts.meetsGpaMinimum, true);
  assert.equal(facts.meetsCampus, true);
});

test("compute weights sub-scores 40/30/30", () => {
  // 90*0.4 + 85*0.3 + 80*0.3 = 36 + 25.5 + 24 = 85.5 -> 86
  const result = computeScoreResult(modelOutput(), gates());
  assert.equal(result.matchScore, 86);
  assert.equal(result.eligible, true);
  assert.equal(result.skillsScore, 90);
});

test("compute ANDs all three eligibility signals", () => {
  const lowGpa = computeEligibilityGates(
    { gpaMin: 3.0, campus: ["Laucala Campus"] },
    { degrees: [{ gpa: 2.5 }], campuses: ["Laucala Campus"] }
  );
  assert.equal(computeScoreResult(modelOutput(), lowGpa).eligible, false);

  const wrongCampus = computeEligibilityGates(
    { gpaMin: null, campus: ["Laucala Campus"] },
    { degrees: [], campuses: ["Labasa Campus"] }
  );
  assert.equal(computeScoreResult(modelOutput(), wrongCampus).eligible, false);

  assert.equal(
    computeScoreResult(modelOutput({ meetsDegreeRequirement: false }), gates())
      .eligible,
    false
  );
});

test("compute caps ineligible totals and appends missing gate requirements", () => {
  const facts = computeEligibilityGates(
    { gpaMin: 3.0, campus: ["Laucala Campus"] },
    { degrees: [{ gpa: 2.5 }], campuses: ["Labasa Campus"] }
  );
  const result = computeScoreResult(modelOutput(), facts);
  assert.equal(result.matchScore, INELIGIBLE_SCORE_CAP);
  assert.ok(result.missingRequirements.some((entry) => /GPA/i.test(entry)));
  assert.ok(result.missingRequirements.some((entry) => /Labasa Campus/i.test(entry)));
});

test("compute does not duplicate requirements the model already listed", () => {
  const facts = computeEligibilityGates(
    { gpaMin: 3.0, campus: ["Laucala Campus"] },
    { degrees: [{ gpa: 2.5 }], campuses: ["Laucala Campus"] }
  );
  const result = computeScoreResult(
    modelOutput({ missingRequirements: ["GPA below the 3.00 minimum"] }),
    facts
  );
  assert.equal(
    result.missingRequirements.filter((entry) => /GPA/i.test(entry)).length,
    1
  );
});

test("built prompt embeds verified checks, campuses, and fairness rule", () => {
  const facts = gates();
  const { system, prompt } = buildScorePrompt(job, profile, "I love teaching CS111.", facts);
  assert.ok(prompt.includes("highest degree GPA 3.40 vs minimum 3.00 -> passes"));
  assert.ok(prompt.includes("Campus overlap:"));
  assert.ok(prompt.includes("Campuses: Laucala Campus"));
  assert.ok(prompt.includes("completed degree") || prompt.includes("in-progress transcript"));
  assert.ok(system.includes("40%") && system.includes("30%"));
  assert.ok(system.includes("Never infer age, gender, ethnicity"));
});
