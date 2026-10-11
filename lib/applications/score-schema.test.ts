import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { rankApplicantsByScore } from "@/lib/applications/applicant-ranking";
import {
  INELIGIBLE_SCORE_CAP,
  computeEligibilityGates,
  computeScoreResult,
  scoreModelSchema,
  type ScoreModelOutput,
  type ScoringFacts,
} from "@/lib/applications/score-schema";

const model = (over: Partial<ScoreModelOutput> = {}): ScoreModelOutput => ({
  skillsScore: 80,
  educationScore: 80,
  motivationScore: 80,
  meetsDegreeRequirement: true,
  qualificationFit: "Strong background in the required area.",
  motivationFit: "Clear interest in the role.",
  missingRequirements: [],
  ...over,
});

const facts = (over: Partial<ScoringFacts> = {}): ScoringFacts => ({
  meetsGpaMinimum: true,
  meetsCampus: true,
  highestGpa: 3.9,
  gpaMin: null,
  jobCampuses: [],
  applicantCampuses: [],
  ...over,
});

describe("AI Scoring", () => {
  test("TC-42", () => {
    for (const key of ["skillsScore", "educationScore", "motivationScore"] as const) {
      for (const value of [101, -1]) {
        expect(scoreModelSchema.safeParse(model({ [key]: value })).success, `${key}=${value}`).toBe(false);
      }
      expect(scoreModelSchema.safeParse(model({ [key]: 0 })).success, `${key}=0`).toBe(true);
      expect(scoreModelSchema.safeParse(model({ [key]: 100 })).success, `${key}=100`).toBe(true);
    }

    expect(scoreModelSchema.safeParse(model({ qualificationFit: "x".repeat(2000) })).success).toBe(true);
    expect(scoreModelSchema.safeParse(model({ qualificationFit: "x".repeat(2001) })).success).toBe(false);
    expect(scoreModelSchema.safeParse(model({ motivationFit: "x".repeat(2001) })).success).toBe(false);

    const entry = "requirement";
    expect(scoreModelSchema.safeParse(model({ missingRequirements: [] })).success).toBe(true);
    expect(scoreModelSchema.safeParse(model({ missingRequirements: Array(20).fill(entry) })).success).toBe(true);
    expect(scoreModelSchema.safeParse(model({ missingRequirements: Array(21).fill(entry) })).success).toBe(false);
    expect(scoreModelSchema.safeParse(model({ missingRequirements: ["x".repeat(301)] })).success).toBe(false);
    expect(scoreModelSchema.safeParse(model({ missingRequirements: ["   "] })).success).toBe(false);

    const weighted = computeScoreResult(
      model({ skillsScore: 90, educationScore: 85, motivationScore: 80 }),
      facts()
    );
    expect(weighted.matchScore).toBe(86);
    expect(weighted.matchScore).toBeGreaterThanOrEqual(0);
    expect(weighted.matchScore).toBeLessThanOrEqual(100);

    const rounded = computeScoreResult(
      model({ skillsScore: 50.5, educationScore: 50.4, motivationScore: 50.6 }),
      facts()
    );
    expect(rounded.skillsScore).toBe(51);
    expect(rounded.educationScore).toBe(50);
    expect(rounded.motivationScore).toBe(51);

    expect(
      computeScoreResult(model({ skillsScore: 0, educationScore: 0, motivationScore: 0 }), facts()).matchScore
    ).toBe(0);
    expect(
      computeScoreResult(model({ skillsScore: 100, educationScore: 100, motivationScore: 100 }), facts()).matchScore
    ).toBe(100);
  });

  test("TC-43", () => {
    const descending = rankApplicantsByScore([
      { createdAt: new Date("2026-01-01"), score: { matchScore: 50, status: "COMPLETE" } },
      { createdAt: new Date("2026-01-02"), score: { matchScore: 90, status: "COMPLETE" } },
      { createdAt: new Date("2026-01-03"), score: { matchScore: 70, status: "COMPLETE" } },
    ]);
    expect(descending.map((r) => r.score?.matchScore)).toEqual([90, 70, 50]);

    const mixed = rankApplicantsByScore([
      { createdAt: new Date("2026-01-01"), score: null },
      { createdAt: new Date("2026-01-02"), score: { matchScore: 60, status: "COMPLETE" } },
      { createdAt: new Date("2026-01-03"), score: { matchScore: null, status: "PENDING" } },
      { createdAt: new Date("2026-01-04"), score: { matchScore: null, status: "FAILED" } },
    ]);
    const statuses = mixed.map((r) => r.score?.status ?? null);
    expect(statuses[0]).toBe("COMPLETE");
    expect(statuses.slice(1).every((s) => s === null || s === "PENDING" || s === "FAILED")).toBe(true);
    expect(mixed.slice(1).map((r) => r.createdAt.toISOString().slice(0, 10))).toEqual([
      "2026-01-04",
      "2026-01-03",
      "2026-01-01",
    ]);

    const tied = rankApplicantsByScore([
      { createdAt: new Date("2026-01-01"), score: { matchScore: 70, status: "COMPLETE" } },
      { createdAt: new Date("2026-01-05"), score: { matchScore: 70, status: "COMPLETE" } },
    ]);
    expect(tied[0]?.createdAt.toISOString()).toBe("2026-01-05T00:00:00.000Z");
  });

  test("TC-44", () => {
    const eligible = computeEligibilityGates({ gpaMin: 3.5, campus: [] }, { degrees: [{ gpa: 3.9 }], campuses: [] });
    expect(eligible.meetsGpaMinimum).toBe(true);
    expect(computeScoreResult(model(), eligible).eligible).toBe(true);

    const ineligible = computeEligibilityGates({ gpaMin: 4.0, campus: [] }, { degrees: [{ gpa: 3.9 }], campuses: [] });
    expect(ineligible.meetsGpaMinimum).toBe(false);
    const capped = computeScoreResult(
      model({ skillsScore: 100, educationScore: 100, motivationScore: 100 }),
      ineligible
    );
    expect(capped.eligible).toBe(false);
    expect(capped.matchScore).toBeLessThanOrEqual(INELIGIBLE_SCORE_CAP);
    expect(capped.missingRequirements.some((entry) => /gpa/i.test(entry))).toBe(true);

    const multiple = computeEligibilityGates(
      { gpaMin: 3.6, campus: [] },
      { degrees: [{ gpa: 3.1 }, { gpa: 3.9 }, { gpa: 3.4 }], campuses: [] }
    );
    expect(multiple.highestGpa).toBe(3.9);
    expect(multiple.meetsGpaMinimum).toBe(true);
  });

  test("TC-45", () => {
    const matching = computeEligibilityGates(
      { gpaMin: null, campus: ["Cook Islands Campus"] },
      { degrees: [{ gpa: 3.9 }], campuses: ["Cook Islands Campus"] }
    );
    expect(matching.meetsCampus).toBe(true);

    const legacy = computeEligibilityGates(
      { gpaMin: null, campus: ["Rarotonga"] },
      { degrees: [{ gpa: 3.9 }], campuses: ["Cook Islands Campus"] }
    );
    expect(legacy.meetsCampus).toBe(true);

    const disjoint = computeEligibilityGates(
      { gpaMin: null, campus: ["Emalus Campus"] },
      { degrees: [{ gpa: 3.9 }], campuses: ["Laucala Campus"] }
    );
    expect(disjoint.meetsCampus).toBe(false);
    const capped = computeScoreResult(
      model({ skillsScore: 100, educationScore: 100, motivationScore: 100 }),
      disjoint
    );
    expect(capped.eligible).toBe(false);
    expect(capped.matchScore).toBeLessThanOrEqual(INELIGIBLE_SCORE_CAP);
    expect(capped.missingRequirements.some((entry) => /campus|centre/i.test(entry))).toBe(true);

    const unrestricted = computeEligibilityGates(
      { gpaMin: null, campus: [] },
      { degrees: [{ gpa: 3.9 }], campuses: ["Laucala Campus"] }
    );
    expect(unrestricted.meetsCampus).toBe(true);
  });

  test("TC-46", () => {
    const ranked = rankApplicantsByScore([
      { createdAt: new Date("2026-01-01"), score: { matchScore: 0, status: "COMPLETE" } },
      { createdAt: new Date("2026-01-02"), score: { matchScore: null, status: "PENDING" } },
    ]);
    expect(ranked[0]?.score?.status).toBe("COMPLETE");
    expect(ranked[0]?.score?.matchScore).toBe(0);
    expect(ranked[1]?.score?.status).toBe("PENDING");

    const source = readFileSync(
      new URL("../../components/applications/application-score-cell.tsx", import.meta.url),
      "utf8"
    );
    expect(source).toMatch(/score === null/);
    expect(source).toMatch(/score\.status === "PENDING"/);
    expect(source).toMatch(/score\.status === "FAILED"/);
    expect(source).toMatch(/Scoring\.\.\./);
    expect(source).toMatch(/Failed/);
  });

  test("TC-47", () => {
    const source = readFileSync(
      new URL("../applications/application-list-queries.ts", import.meta.url),
      "utf8"
    );
    expect(source).not.toMatch(/score:\s*\{\s*select/);
  });

  test("TC-48", () => {
    expect(computeScoreResult(model({ meetsDegreeRequirement: true }), facts()).eligible).toBe(true);
    expect(computeScoreResult(model({ meetsDegreeRequirement: false }), facts()).eligible).toBe(false);
    expect(
      computeScoreResult(model(), facts({ meetsGpaMinimum: false, gpaMin: 4.5, highestGpa: 3.0 })).eligible
    ).toBe(false);
    expect(computeScoreResult(model(), facts({ meetsCampus: false })).eligible).toBe(false);

    const deduped = computeScoreResult(
      model({ missingRequirements: ["Minimum GPA of 4.50"] }),
      facts({ meetsGpaMinimum: false, gpaMin: 4.5, highestGpa: 3.0 })
    );
    expect(deduped.missingRequirements.filter((entry) => /gpa/i.test(entry))).toHaveLength(1);

    const source = readFileSync(
      new URL("../applications/admin-applicants-queries.ts", import.meta.url),
      "utf8"
    );
    for (const field of ["eligible", "qualificationFit", "motivationFit", "missingRequirements"]) {
      expect(source, field).toMatch(new RegExp(`\\b${field}\\b`));
    }
  });
});