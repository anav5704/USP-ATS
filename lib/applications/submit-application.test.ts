import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  submitApplication,
  SubmitApplicationError,
} from "@/lib/applications/submit-application";
import { JOB_TEMPLATES } from "@/lib/jobs/job-templates";
import { USP_CAMPUSES_CENTRES, USP_DEPARTMENTS } from "@/lib/jobs/job-constants";

// Explicit opt-in: all fixtures and transitions are rolled back, including on failure.
test("application submit lifecycle: create once, withdraw, reapply reuses the record", {
  skip: process.env.RUN_APPLICATION_DB_TESTS !== "1",
}, async () => {
  const rollback = new Error("Rollback application test fixtures");
  try {
    await assert.rejects(prisma.$transaction(async (tx) => {
      const member = randomUUID();
      await tx.user.create({ data: { id: member, name: "Application test", email: `${member}@example.invalid`, role: "member" } });
      const posting = await tx.jobPosting.create({ data: {
        title: "Teaching Assistant", ...JOB_TEMPLATES["Teaching Assistant"],
        department: USP_DEPARTMENTS[0], campus: [USP_CAMPUSES_CENTRES[0]], degree: [],
        deadline: new Date("2099-12-31T11:59:59Z"), createdById: member, status: "ACTIVE",
      } });

      const first = await submitApplication(tx.application, tx.jobPosting, tx.scoreResult, member, { jobId: posting.id, coverLetter: "First letter" });
      assert.equal(first.outcome, "created");
      assert.ok(first.applicationId);
      let record = await tx.application.findUniqueOrThrow({ where: { jobId_studentId: { jobId: posting.id, studentId: member } } });
      assert.equal(record.status, "APPLIED");
      assert.equal(record.coverLetter, "First letter");
      assert.equal(await tx.application.count({ where: { jobId: posting.id, studentId: member } }), 1);
      let score = await tx.scoreResult.findUniqueOrThrow({ where: { applicationId: first.applicationId } });
      assert.equal(score.status, "PENDING");
      assert.equal(score.matchScore, null);

      await assert.rejects(submitApplication(tx.application, tx.jobPosting, tx.scoreResult, member, { jobId: posting.id, coverLetter: "Duplicate" }),
        (error: unknown) => error instanceof SubmitApplicationError && error.status === 409);
      assert.equal(await tx.application.count({ where: { jobId: posting.id, studentId: member } }), 1);

      await tx.application.updateMany({ where: { id: record.id, studentId: member, status: "APPLIED" }, data: { status: "WITHDRAWN" } });
      const originalId = record.id;
      const reapplied = await submitApplication(tx.application, tx.jobPosting, tx.scoreResult, member, { jobId: posting.id, coverLetter: "Second letter" });
      assert.equal(reapplied.outcome, "reapplied");
      assert.equal(reapplied.applicationId, originalId);
      record = await tx.application.findUniqueOrThrow({ where: { jobId_studentId: { jobId: posting.id, studentId: member } } });
      assert.equal(record.id, originalId);
      assert.equal(record.status, "APPLIED");
      assert.equal(record.coverLetter, "Second letter");
      assert.ok(record.updatedAt >= record.createdAt);
      assert.equal(await tx.application.count({ where: { jobId: posting.id, studentId: member } }), 1);
      // Reapply resets a stale score back to PENDING for rescoring.
      await tx.scoreResult.update({ where: { applicationId: originalId }, data: { status: "COMPLETE", matchScore: 85, eligible: true } });
      await tx.application.updateMany({ where: { id: record.id }, data: { status: "WITHDRAWN" } });
      const reappliedAgain = await submitApplication(tx.application, tx.jobPosting, tx.scoreResult, member, { jobId: posting.id, coverLetter: "Third letter" });
      assert.equal(reappliedAgain.applicationId, originalId);
      score = await tx.scoreResult.findUniqueOrThrow({ where: { applicationId: originalId } });
      assert.equal(score.status, "PENDING");
      assert.equal(score.matchScore, null);

      await tx.application.updateMany({ where: { id: record.id }, data: { status: "DECLINED" } });
      await assert.rejects(submitApplication(tx.application, tx.jobPosting, tx.scoreResult, member, { jobId: posting.id, coverLetter: "After decline" }),
        (error: unknown) => error instanceof SubmitApplicationError && error.status === 409);

      await tx.application.updateMany({ where: { id: record.id }, data: { status: "WITHDRAWN" } });
      await tx.jobPosting.update({ where: { id: posting.id }, data: { deadline: new Date("2020-01-01T00:00:00Z") } });
      await assert.rejects(submitApplication(tx.application, tx.jobPosting, tx.scoreResult, member, { jobId: posting.id, coverLetter: "After expiry" }),
        (error: unknown) => error instanceof SubmitApplicationError && error.status === 400);
      assert.equal(await tx.application.count({ where: { jobId: posting.id, studentId: member } }), 1);

      throw rollback;
    }, { maxWait: 30_000, timeout: 60_000 }), (error: unknown) => error === rollback);
  } finally {
    await prisma.$disconnect();
  }
});