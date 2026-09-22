import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  JobModificationError,
  requestJobModification,
  reviewJobModification,
} from "@/lib/jobs/job-modification";
import type { JobInput } from "@/lib/jobs/job-schema";
import { JOB_TEMPLATES } from "@/lib/jobs/job-templates";
import {
  USP_CAMPUSES_CENTRES,
  USP_DEPARTMENTS,
} from "@/lib/jobs/job-constants";

const proposed: JobInput = {
  title: "Teaching Assistant",
  ...JOB_TEMPLATES["Teaching Assistant"],
  description: "Updated teaching duties",
  department: USP_DEPARTMENTS[0],
  campus: [USP_CAMPUSES_CENTRES[0]],
  degree: [],
  benefit: "Lunch",
  deadline: "2099-12-31",
};

const posting = {
  id: "job-1",
  ...proposed,
  description: "Original teaching duties",
  gpaMin: 3.5,
  hourlyPay: 15,
  benefit: null,
  deadline: new Date("2099-12-31T11:59:59.999Z"),
  status: "ACTIVE",
  createdById: "admin-a",
  requestedById: "admin-a",
  requestedAt: new Date(),
  approvedById: "admin-b",
  approvedAt: new Date(),
  rejectedById: null,
  rejectedAt: null,
  rejectionReason: null,
  revision: 7,
  pendingModificationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type Write = { where: unknown; data: Record<string, unknown> };

function clientForRequest(currentPosting = posting) {
  const postingWrites: Write[] = [];
  const requestCreates: Array<{ data: Record<string, unknown> }> = [];
  const transaction = {
    jobPosting: {
      findUnique: async () => currentPosting,
      updateMany: async (args: Write) => {
        postingWrites.push(args);
        return { count: 1 };
      },
    },
    jobModificationRequest: {
      create: async (args: { data: Record<string, unknown> }) => {
        requestCreates.push(args);
        return { id: "mod-1" };
      },
    },
  };
  const client = {
    $transaction: async (callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
  } as unknown as PrismaClient;
  return { client, postingWrites, requestCreates };
}

function clientForReview(
  requestedById = "admin-a",
  proposedData: JobInput = proposed
) {
  const postingWrites: Write[] = [];
  const requestWrites: Write[] = [];
  const request = {
    id: "mod-1",
    jobId: posting.id,
    requestedById,
    proposedData,
    previousData: proposed,
    jobRevision: posting.revision,
    revision: 0,
    status: "PENDING",
  };
  const transaction = {
    jobPosting: {
      updateMany: async (args: Write) => {
        postingWrites.push(args);
        return { count: 1 };
      },
    },
    jobModificationRequest: {
      findFirst: async () => request,
      updateMany: async (args: Write) => {
        requestWrites.push(args);
        return { count: 1 };
      },
    },
  };
  const client = {
    $transaction: async (callback: (tx: typeof transaction) => unknown) =>
      callback(transaction),
  } as unknown as PrismaClient;
  return { client, postingWrites, requestWrites };
}

test("requesting a modification stores snapshots and only links the approved posting", async () => {
  const { client, postingWrites, requestCreates } = clientForRequest();
  const result = await requestJobModification(
    client,
    posting.id,
    "admin-c",
    proposed
  );

  assert.equal(result.id, "mod-1");
  assert.equal(requestCreates[0].data.jobId, posting.id);
  assert.equal(requestCreates[0].data.requestedById, "admin-c");
  assert.equal(requestCreates[0].data.jobRevision, posting.revision);
  assert.equal(
    (requestCreates[0].data.previousData as JobInput).description,
    posting.description
  );
  assert.equal(
    (requestCreates[0].data.proposedData as JobInput).description,
    proposed.description
  );
  assert.deepEqual(postingWrites[0].data, { pendingModificationId: "mod-1" });
});

test("requesting a modification preserves a legacy approved posting snapshot", async () => {
  const legacyPosting = {
    ...posting,
    jobType: "Internship" as const,
    hourlyPay: 0,
  };
  const { client, requestCreates } = clientForRequest(legacyPosting);

  await requestJobModification(client, posting.id, "admin-c", proposed);

  const previous = requestCreates[0].data.previousData as JobInput;
  assert.equal(previous.jobType, "Internship");
  assert.equal(previous.hourlyPay, 0);
});

test("the requesting admin cannot approve or reject a modification", async () => {
  for (const decision of ["approve", "reject"] as const) {
    const { client, postingWrites, requestWrites } = clientForReview();
    await assert.rejects(
      reviewJobModification(client, posting.id, "mod-1", "admin-a", {
        decision,
        revision: 0,
      }),
      (error: unknown) =>
        error instanceof JobModificationError && error.status === 403
    );
    assert.equal(postingWrites.length, 0);
    assert.equal(requestWrites.length, 0);
  }
});

test("independent approval applies proposed values without replacing the posting", async () => {
  const { client, postingWrites, requestWrites } = clientForReview();
  await reviewJobModification(client, posting.id, "mod-1", "admin-b", {
    decision: "approve",
    revision: 0,
  });

  assert.equal(postingWrites[0].data.description, proposed.description);
  assert.equal(postingWrites[0].data.pendingModificationId, null);
  assert.deepEqual(postingWrites[0].data.revision, { increment: 1 });
  assert.equal(postingWrites[0].data.status, undefined);
  assert.equal(requestWrites[0].data.status, "APPROVED");
  assert.equal(requestWrites[0].data.reviewedById, "admin-b");
});

test("approval preserves derived expired lifecycle behavior", async () => {
  const expiredProposal = { ...proposed, deadline: "2020-01-01" };
  const { client, postingWrites } = clientForReview(
    "admin-a",
    expiredProposal
  );
  await reviewJobModification(client, posting.id, "mod-1", "admin-b", {
    decision: "approve",
    revision: 0,
  });

  assert.equal(
    (postingWrites[0].data.deadline as Date).toISOString(),
    "2020-01-01T11:59:59.999Z"
  );
  assert.equal(postingWrites[0].data.status, undefined);
});

test("rejection and withdrawal clear the pending link without changing approved values", async () => {
  for (const scenario of [
    { decision: "reject" as const, adminId: "admin-b", status: "REJECTED" },
    { decision: "withdraw" as const, adminId: "admin-a", status: "WITHDRAWN" },
  ]) {
    const { client, postingWrites, requestWrites } = clientForReview();
    await reviewJobModification(
      client,
      posting.id,
      "mod-1",
      scenario.adminId,
      { decision: scenario.decision, revision: 0 }
    );

    assert.deepEqual(postingWrites[0].data, { pendingModificationId: null });
    assert.equal(requestWrites[0].data.status, scenario.status);
  }
});
