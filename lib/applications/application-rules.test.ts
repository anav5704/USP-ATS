import assert from "node:assert/strict";
import test from "node:test";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "@/lib/applications/application-schema";
import {
  allowedAdminStatusTargets,
  blocksReapplication,
  canAdminChangeStatus,
  canWithdraw,
  isJobOpenForApplication,
} from "@/lib/applications/application-rules";
import {
  deadlineAtEndOfFijiDay,
  startOfFijiDay,
} from "@/lib/jobs/job-dates";

const TODAY = "2027-01-15";

test("canWithdraw is true only for APPLIED", () => {
  const expected: Record<ApplicationStatus, boolean> = {
    APPLIED: true,
    SHORTLISTED: false,
    ACCEPTED: false,
    DECLINED: false,
    WITHDRAWN: false,
  };
  for (const status of APPLICATION_STATUSES) {
    assert.equal(canWithdraw(status), expected[status], `status ${status}`);
  }
});

test("blocksReapplication is false only for WITHDRAWN", () => {
  const expected: Record<ApplicationStatus, boolean> = {
    APPLIED: true,
    SHORTLISTED: true,
    ACCEPTED: true,
    DECLINED: true,
    WITHDRAWN: false,
  };
  for (const status of APPLICATION_STATUSES) {
    assert.equal(
      blocksReapplication(status),
      expected[status],
      `status ${status}`
    );
  }
});

test("active jobs are open on and after the deadline day", () => {
  assert.equal(
    isJobOpenForApplication(
      { status: "ACTIVE", deadline: deadlineAtEndOfFijiDay("2027-01-16") },
      TODAY
    ),
    true
  );
  assert.equal(
    isJobOpenForApplication(
      { status: "ACTIVE", deadline: deadlineAtEndOfFijiDay(TODAY) },
      TODAY
    ),
    true
  );
  assert.equal(
    isJobOpenForApplication(
      { status: "ACTIVE", deadline: startOfFijiDay(TODAY) },
      TODAY
    ),
    true
  );
});

test("active jobs with a past deadline are closed", () => {
  assert.equal(
    isJobOpenForApplication(
      { status: "ACTIVE", deadline: deadlineAtEndOfFijiDay("2027-01-14") },
      TODAY
    ),
    false
  );
});

test("non-active jobs are closed regardless of deadline", () => {
  for (const status of ["PENDING_APPROVAL", "REJECTED", "ARCHIVED"]) {
    assert.equal(
      isJobOpenForApplication(
        { status, deadline: deadlineAtEndOfFijiDay("2027-02-01") },
        TODAY
      ),
      false,
      `status ${status}`
    );
  }
});

test("string deadlines are accepted", () => {
  assert.equal(
    isJobOpenForApplication(
      { status: "ACTIVE", deadline: "2027-01-15T23:59:59.999+12:00" },
      TODAY
    ),
    true
  );
  assert.equal(
    isJobOpenForApplication(
      { status: "ACTIVE", deadline: "2027-01-14T23:59:59.999+12:00" },
      TODAY
    ),
    false
  );
});

test("admin status transitions preserve final application states", () => {
  assert.deepEqual(allowedAdminStatusTargets("APPLIED"), [
    "SHORTLISTED",
    "ACCEPTED",
    "DECLINED",
  ]);
  assert.deepEqual(allowedAdminStatusTargets("SHORTLISTED"), [
    "ACCEPTED",
    "DECLINED",
  ]);

  for (const status of ["ACCEPTED", "DECLINED", "WITHDRAWN"] as const) {
    assert.deepEqual(allowedAdminStatusTargets(status), []);
  }

  assert.equal(canAdminChangeStatus("APPLIED", "SHORTLISTED"), true);
  assert.equal(canAdminChangeStatus("SHORTLISTED", "ACCEPTED"), true);
  assert.equal(canAdminChangeStatus("SHORTLISTED", "DECLINED"), true);
  assert.equal(canAdminChangeStatus("ACCEPTED", "DECLINED"), false);
  assert.equal(canAdminChangeStatus("WITHDRAWN", "SHORTLISTED"), false);
});
