import assert from "node:assert/strict";
import test from "node:test";
import { Prisma, type JobPosting } from "@/generated/prisma/client";
import { reviewJob, ReviewError } from "@/lib/jobs/review-job";
import { approvalInputSchema, isOwnApprovalRequest, pendingReviewData, jobEditReviewData } from "@/lib/jobs/approval-schema";
import { JOB_TEMPLATES } from "@/lib/jobs/job-templates";
import { USP_CAMPUSES_CENTRES, USP_DEPARTMENTS } from "@/lib/jobs/job-constants";

function pendingJob(): JobPosting {
  return {
    id: "job", title: "Teaching Assistant", ...JOB_TEMPLATES["Teaching Assistant"],
    department: USP_DEPARTMENTS[0], campus: [USP_CAMPUSES_CENTRES[0]], degree: [],
    gpaMin: new Prisma.Decimal(3.5), hourlyPay: new Prisma.Decimal(15), benefit: "Lunch",
    deadline: new Date("2099-12-31T11:59:59Z"), createdById: "admin-a",
    ...pendingReviewData("admin-a"), revision: 0, createdAt: new Date(), updatedAt: new Date(),
  };
}

function repository(posting: JobPosting | null, count = 1) {
  const writes: Prisma.JobPostingUpdateManyArgs[] = [];
  const jobs = {
    findUnique: async () => posting,
    updateMany: async (args: Prisma.JobPostingUpdateManyArgs) => {
      writes.push(args);
      return { count };
    },
  } as unknown as Parameters<typeof reviewJob>[0];
  return { jobs, writes };
}

const approve = { decision: "approve", revision: 0 } as const;

test("pending edits preserve creator identity; active edits preserve approval", () => {
  const prior = pendingJob();
  const edited = { ...prior, ...jobEditReviewData(prior.status, "admin-c") };
  assert.equal(edited.status, "PENDING_APPROVAL");
  assert.equal(edited.createdById, "admin-a");
  assert.equal(edited.requestedById, "admin-c");
  assert.equal(edited.approvedById, null);
  assert.equal(edited.approvedAt, null);
  assert.equal(isOwnApprovalRequest(edited, "admin-a"), true);
  assert.equal(isOwnApprovalRequest(edited, "admin-c"), true);
  assert.equal(isOwnApprovalRequest(edited, "admin-b"), false);
  for (const status of ["ACTIVE", "ARCHIVED", "REJECTED"]) {
    assert.deepEqual(jobEditReviewData(status, "admin-c"), {});
  }
});

test("creator and latest editor cannot approve or reject, even via direct service call", async () => {
  for (const adminId of ["admin-a", "admin-c"]) {
    const { jobs, writes } = repository({ ...pendingJob(), requestedById: "admin-c" });
    for (const decision of ["approve", "reject"] as const) {
      await assert.rejects(reviewJob(jobs, "job", adminId, { ...approve, decision }), (error: unknown) =>
        error instanceof ReviewError && error.status === 403);
    }
    assert.equal(writes.length, 0);
  }
});

test("independent admin approval becomes active with server-derived identity and guarded revision", async () => {
  const { jobs, writes } = repository(pendingJob());
  await reviewJob(jobs, "job", "admin-b", approve);
  assert.equal(writes[0].data.status, "ACTIVE");
  assert.equal(writes[0].data.approvedById, "admin-b");
  assert.ok(writes[0].data.approvedAt instanceof Date);
  assert.equal(writes[0].where?.status, "PENDING_APPROVAL");
  assert.equal(writes[0].where?.revision, 0);
  assert.deepEqual(writes[0].where?.createdById, { not: "admin-b" });
  assert.deepEqual(writes[0].where?.OR, [{ requestedById: null }, { requestedById: { not: "admin-b" } }]);
});

test("independent rejection records reviewer, timestamp and reason", async () => {
  for (const adminId of ["admin-b"]) {
    const { jobs, writes } = repository(pendingJob());
    await reviewJob(jobs, "job", adminId, { decision: "reject", revision: 0, rejectionReason: "  Incorrect details  " });
    assert.equal(writes[0].data.status, "REJECTED");
    assert.equal(writes[0].data.rejectedById, adminId);
    assert.ok(writes[0].data.rejectedAt instanceof Date);
    assert.equal(writes[0].data.rejectionReason, "Incorrect details");
    assert.equal(writes[0].data.approvedById, null);
  }
});

test("withdrawal archives only the owner's pending request", async () => {
  const { jobs, writes } = repository(pendingJob());
  await reviewJob(jobs, "job", "admin-a", { decision: "withdraw", revision: 0 });
  assert.equal(writes[0].data.status, "ARCHIVED");
  await assert.rejects(reviewJob(jobs, "job", "admin-b", { decision: "withdraw", revision: 0 }),
    (error: unknown) => error instanceof ReviewError && error.status === 403);
  for (const status of ["ACTIVE", "REJECTED", "ARCHIVED"] as const) {
    await assert.rejects(reviewJob(repository({ ...pendingJob(), status }).jobs, "job", "admin-a", { decision: "withdraw", revision: 0 }),
      (error: unknown) => error instanceof ReviewError && error.status === 409);
  }
});

test("only pending, unchanged requests can be reviewed", async () => {
  for (const posting of [
    { ...pendingJob(), status: "ACTIVE" as const },
    { ...pendingJob(), status: "REJECTED" as const },
    { ...pendingJob(), status: "ARCHIVED" as const },
    { ...pendingJob(), revision: 1 },
  ]) {
    const { jobs, writes } = repository(posting);
    await assert.rejects(reviewJob(jobs, "job", "admin-b", approve), (error: unknown) =>
      error instanceof ReviewError && error.status === 409);
    assert.equal(writes.length, 0);
  }
});

test("an edit, deletion, archive or competing review during approval cannot be overwritten", async () => {
  const { jobs } = repository(pendingJob(), 0);
  await assert.rejects(reviewJob(jobs, "job", "admin-b", approve), (error: unknown) =>
    error instanceof ReviewError && error.status === 409);
});

test("approval rejects invalid persisted pay, GPA, template type and expired deadline", async () => {
  for (const changes of [
    { hourlyPay: new Prisma.Decimal(0) },
    { hourlyPay: new Prisma.Decimal(-1) },
    { gpaMin: new Prisma.Decimal(5) },
    { jobType: "Volunteer" },
    { deadline: new Date("2000-01-01") },
  ]) {
    const { jobs, writes } = repository({ ...pendingJob(), ...changes });
    await assert.rejects(reviewJob(jobs, "job", "admin-b", approve), (error: unknown) =>
      error instanceof ReviewError && error.status === 400);
    assert.equal(writes.length, 0);
  }
});

test("clients cannot supply approver identity, status or excessive rejection text", () => {
  for (const extra of [{ approvedById: "admin-b" }, { status: "ACTIVE" }, { rejectionReason: "x".repeat(501) }]) {
    assert.equal(approvalInputSchema.safeParse({ ...approve, ...extra }).success, false);
  }
});
