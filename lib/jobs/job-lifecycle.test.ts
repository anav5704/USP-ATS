import assert from "node:assert/strict";
import test from "node:test";
import { effectiveJobStatus } from "@/lib/jobs/job-lifecycle";

const NOW = new Date("2027-01-15T12:00:00.000Z");

test("past-deadline active postings are treated as archived", () => {
  assert.equal(
    effectiveJobStatus(
      { status: "ACTIVE", deadline: "2027-01-15T11:59:59.999Z" },
      NOW
    ),
    "ARCHIVED"
  );
});

test("active postings remain active until their deadline passes", () => {
  assert.equal(
    effectiveJobStatus(
      { status: "ACTIVE", deadline: "2027-01-15T12:00:00.000Z" },
      NOW
    ),
    "ACTIVE"
  );
  assert.equal(
    effectiveJobStatus(
      { status: "ACTIVE", deadline: "2027-01-16T12:00:00.000Z" },
      NOW
    ),
    "ACTIVE"
  );
});

test("persisted lifecycle statuses are otherwise unchanged", () => {
  for (const status of ["PENDING_APPROVAL", "REJECTED", "ARCHIVED"] as const) {
    assert.equal(
      effectiveJobStatus(
        { status, deadline: "2020-01-01T00:00:00.000Z" },
        NOW
      ),
      status
    );
  }
});
