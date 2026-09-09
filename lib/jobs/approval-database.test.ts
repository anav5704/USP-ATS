import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { pendingReviewData, jobEditReviewData } from "@/lib/jobs/approval-schema";
import { reviewJob, ReviewError } from "@/lib/jobs/review-job";
import { JOB_TEMPLATES } from "@/lib/jobs/job-templates";
import { USP_CAMPUSES_CENTRES, USP_DEPARTMENTS } from "@/lib/jobs/job-constants";

// Explicit opt-in: all fixtures and transitions are rolled back, including on failure.
test("database approval lifecycle preserves visibility and enforces independent review", {
  skip: process.env.RUN_APPROVAL_DB_TESTS !== "1",
}, async () => {
  const rollback = new Error("Rollback approval test fixtures");
  try {
    await assert.rejects(prisma.$transaction(async (tx) => {
      const adminA = randomUUID();
      const adminB = randomUUID();
      for (const id of [adminA, adminB]) {
        await tx.user.create({ data: { id, name: "Approval test", email: `${id}@example.invalid`, role: "admin" } });
      }
      const posting = await tx.jobPosting.create({ data: {
        title: "Teaching Assistant", ...JOB_TEMPLATES["Teaching Assistant"],
        department: USP_DEPARTMENTS[0], campus: [USP_CAMPUSES_CENTRES[0]], degree: [],
        deadline: new Date("2099-12-31T11:59:59Z"), createdById: adminA,
        ...pendingReviewData(adminA),
      } });
      const visible = () => tx.jobPosting.count({ where: { id: posting.id, status: "ACTIVE", deadline: { gte: new Date() } } });
      assert.equal(posting.status, "PENDING_APPROVAL");
      assert.equal(await visible(), 0);
      assert.equal(await tx.jobPosting.count({ where: { id: posting.id, status: "PENDING_APPROVAL" } }), 1);
      await assert.rejects(reviewJob(tx.jobPosting, posting.id, adminA, { decision: "approve", revision: 0 }),
        (error: unknown) => error instanceof ReviewError && error.status === 403);
      await reviewJob(tx.jobPosting, posting.id, adminB, { decision: "approve", revision: 0 });
      assert.equal(await visible(), 1);
      const edited = await tx.jobPosting.update({ where: { id: posting.id }, data: {
        description: "Updated teaching duties", ...jobEditReviewData("ACTIVE", adminA), revision: { increment: 1 },
      } });
      assert.equal(edited.createdById, adminA);
      assert.equal(edited.approvedById, adminB);
      assert.equal(edited.status, "ACTIVE");
      assert.equal(await visible(), 1);
      await assert.rejects(reviewJob(tx.jobPosting, posting.id, adminB, { decision: "approve", revision: 0 }),
        (error: unknown) => error instanceof ReviewError && error.status === 409);
      const pending = await tx.jobPosting.create({ data: {
        title: "Teaching Assistant", ...JOB_TEMPLATES["Teaching Assistant"],
        department: USP_DEPARTMENTS[0], campus: [USP_CAMPUSES_CENTRES[0]], degree: [],
        deadline: new Date("2099-12-31T11:59:59Z"), createdById: adminA,
        ...pendingReviewData(adminA),
      } });
      await assert.rejects(reviewJob(tx.jobPosting, pending.id, adminA, { decision: "reject", revision: 0 }),
        (error: unknown) => error instanceof ReviewError && error.status === 403);
      await reviewJob(tx.jobPosting, pending.id, adminA, { decision: "withdraw", revision: 0 });
      assert.equal((await tx.jobPosting.findUniqueOrThrow({ where: { id: pending.id } })).status, "ARCHIVED");
      // Reset this isolated fixture to verify a separate pending rejection.
      await tx.jobPosting.update({ where: { id: posting.id }, data: pendingReviewData(adminA) });
      await reviewJob(tx.jobPosting, posting.id, adminB, { decision: "reject", revision: edited.revision, rejectionReason: "Revise duties" });
      const rejected = await tx.jobPosting.findUniqueOrThrow({ where: { id: posting.id } });
      assert.equal(rejected.status, "REJECTED");
      assert.equal(rejected.rejectedById, adminB);
      assert.equal(rejected.rejectionReason, "Revise duties");
      assert.equal(await visible(), 0);
      const resubmitted = await tx.jobPosting.update({ where: { id: posting.id }, data: {
        ...pendingReviewData(adminA), revision: { increment: 1 },
      } });
      await reviewJob(tx.jobPosting, posting.id, adminB, { decision: "approve", revision: resubmitted.revision });
      assert.equal(await visible(), 1);
      await tx.jobPosting.update({ where: { id: posting.id }, data: { status: "ARCHIVED" } });
      assert.equal(await visible(), 0);
      throw rollback;
    }, { maxWait: 30_000, timeout: 60_000 }), (error: unknown) => error === rollback);
  } finally {
    await prisma.$disconnect();
  }
});
