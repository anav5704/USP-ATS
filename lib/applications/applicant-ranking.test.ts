import assert from "node:assert/strict";
import test from "node:test";
import { rankApplicantsByScore } from "@/lib/applications/applicant-ranking";

const createdAt = new Date("2026-09-19T00:00:00Z");

test("ranks completed scores highest first and keeps non-complete scores below them", () => {
  const applications = [
    { id: "pending", createdAt, score: { status: "PENDING" as const, matchScore: null } },
    { id: "low", createdAt, score: { status: "COMPLETE" as const, matchScore: 61 } },
    { id: "failed", createdAt, score: { status: "FAILED" as const, matchScore: null } },
    { id: "high", createdAt, score: { status: "COMPLETE" as const, matchScore: 92 } },
    { id: "missing", createdAt, score: null },
  ];

  assert.deepEqual(
    rankApplicantsByScore(applications).map((application) => application.id),
    ["high", "low", "pending", "failed", "missing"]
  );
});

test("uses newest application first when scores are equal or unavailable", () => {
  const applications = [
    {
      id: "older-complete",
      createdAt: new Date("2026-09-17T00:00:00Z"),
      score: { status: "COMPLETE" as const, matchScore: 80 },
    },
    {
      id: "newer-complete",
      createdAt: new Date("2026-09-18T00:00:00Z"),
      score: { status: "COMPLETE" as const, matchScore: 80 },
    },
    {
      id: "older-pending",
      createdAt: new Date("2026-09-15T00:00:00Z"),
      score: { status: "PENDING" as const, matchScore: null },
    },
    {
      id: "newer-failed",
      createdAt: new Date("2026-09-16T00:00:00Z"),
      score: { status: "FAILED" as const, matchScore: null },
    },
  ];

  assert.deepEqual(
    rankApplicantsByScore(applications).map((application) => application.id),
    ["newer-complete", "older-complete", "newer-failed", "older-pending"]
  );
});
