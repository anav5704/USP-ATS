import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { isJobOpenForApplication } from "@/lib/applications/application-rules";
import { reviewJobModification } from "@/lib/jobs/job-modification";
import { deadlineAtEndOfFijiDay, startOfFijiDay, toFijiDate, todayInFiji } from "@/lib/jobs/job-dates";
import {
  unarchiveActionFor,
  unarchiveJobPosting,
  UnarchiveJobError,
  validateReplacementDeadline,
} from "@/lib/jobs/unarchive-job";

const DAY_MS = 86_400_000;

function fijiDateFromToday(days: number) {
  return toFijiDate(new Date(startOfFijiDay(todayInFiji()).getTime() + days * DAY_MS));
}

function posting(over: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    title: "Research Assistant",
    description: "Support research.",
    department: "SBM",
    jobType: "Part Time",
    campus: ["Laucala Campus"],
    gpaMin: null,
    degree: [],
    skills: [],
    hours: 10,
    hourlyPay: 15,
    benefit: null,
    status: "ARCHIVED",
    deadline: deadlineAtEndOfFijiDay(fijiDateFromToday(-1)),
    revision: 0,
    pendingModificationId: null as string | null,
    approvedAt: new Date(),
    requestedById: "admin-0",
    rejectedAt: null,
    applications: [{ id: "application-1", score: { matchScore: 88 } }],
    ...over,
  };
}

type TestUpdateData = Record<string, unknown> & {
  pendingModificationId?: string | null;
  status?: string;
  deadline?: Date;
  revision?: { increment: number };
};

function fakeClient(initial = posting()) {
  const state = {
    posting: initial,
    request: null as null | Record<string, unknown>,
    scoreTriggers: 0,
  };
  const transaction = {
    jobPosting: {
      findUnique: async () => state.posting,
      updateMany: async ({ data }: { data: TestUpdateData }) => {
        if (data.pendingModificationId !== undefined) {
          state.posting.pendingModificationId = data.pendingModificationId;
        }
        if (typeof data.status === "string") state.posting.status = data.status;
        if (data.deadline instanceof Date) state.posting.deadline = data.deadline;
        if (data.revision?.increment) state.posting.revision += data.revision.increment;
        return { count: 1 };
      },
    },
    jobModificationRequest: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.request = {
          id: "request-1",
          status: "PENDING",
          revision: 0,
          requestedAt: new Date(),
          reviewedAt: null,
          reviewedById: null,
          rejectionReason: null,
          ...data,
        };
        return { id: "request-1" };
      },
      findFirst: async () => state.request,
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        if (!state.request) return { count: 0 };
        state.request = { ...state.request, ...data };
        return { count: 1 };
      },
    },
  };
  const client = {
    ...transaction,
    $transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
  } as unknown as PrismaClient;
  return { client, state };
}

describe("job unarchive lifecycle", () => {
  test("archived posting with a valid deadline becomes active directly", async () => {
    const originalApplications = [{ id: "application-1", score: { matchScore: 88 } }];
    const setup = fakeClient(posting({
      deadline: deadlineAtEndOfFijiDay(fijiDateFromToday(2)),
      applications: originalApplications,
    }));

    await expect(
      unarchiveJobPosting(setup.client, "job-1", "admin-1", undefined)
    ).resolves.toEqual({ outcome: "active" });
    expect(setup.state.posting.status).toBe("ACTIVE");
    expect(setup.state.posting.applications).toBe(originalApplications);
    expect(setup.state.request).toBeNull();
    expect(setup.state.scoreTriggers).toBe(0);
  });

  test("expired posting requires a valid future replacement deadline", () => {
    const expired = posting();
    expect(() => unarchiveActionFor(expired, undefined)).toThrowError(UnarchiveJobError);
    expect(() =>
      validateReplacementDeadline({ deadline: fijiDateFromToday(-1) })
    ).toThrowError("New application deadline must be a future date.");
    expect(validateReplacementDeadline({ deadline: fijiDateFromToday(2) })).toEqual({
      deadline: fijiDateFromToday(2),
    });
  });

  test("expired unarchive creates one pending request and remains unavailable", async () => {
    const setup = fakeClient();
    const deadline = fijiDateFromToday(3);
    await expect(
      unarchiveJobPosting(setup.client, "job-1", "admin-1", { deadline })
    ).resolves.toEqual({ outcome: "pending_approval", requestId: "request-1" });

    expect(setup.state.posting.status).toBe("ARCHIVED");
    expect(setup.state.posting.pendingModificationId).toBe("request-1");
    expect(setup.state.request?.requestedById).toBe("admin-1");
    expect(isJobOpenForApplication(setup.state.posting)).toBe(false);

    expect(() =>
      unarchiveActionFor(setup.state.posting, { deadline })
    ).toThrowError("already has an approval request pending");
  });

  test("requester cannot approve their own unarchive request", async () => {
    const setup = fakeClient();
    await unarchiveJobPosting(setup.client, "job-1", "admin-1", {
      deadline: fijiDateFromToday(3),
    });
    await expect(
      reviewJobModification(setup.client, "job-1", "request-1", "admin-1", {
        decision: "approve",
        revision: 0,
      })
    ).rejects.toMatchObject({ status: 403 });
    expect(setup.state.posting.status).toBe("ARCHIVED");
  });

  test("another admin approval applies deadline and activates without changing related data", async () => {
    const setup = fakeClient();
    const applications = setup.state.posting.applications;
    const deadline = fijiDateFromToday(4);
    await unarchiveJobPosting(setup.client, "job-1", "admin-1", { deadline });
    await reviewJobModification(setup.client, "job-1", "request-1", "admin-2", {
      decision: "approve",
      revision: 0,
    });

    expect(setup.state.posting.id).toBe("job-1");
    expect(setup.state.posting.status).toBe("ACTIVE");
    expect(toFijiDate(setup.state.posting.deadline)).toBe(deadline);
    expect(setup.state.posting.applications).toBe(applications);
    expect(setup.state.request?.status).toBe("APPROVED");
    expect(setup.state.scoreTriggers).toBe(0);
    expect(isJobOpenForApplication(setup.state.posting)).toBe(true);
  });

  test("rejection preserves archived status and original deadline", async () => {
    const setup = fakeClient();
    const originalDeadline = setup.state.posting.deadline;
    await unarchiveJobPosting(setup.client, "job-1", "admin-1", {
      deadline: fijiDateFromToday(4),
    });
    await reviewJobModification(setup.client, "job-1", "request-1", "admin-2", {
      decision: "reject",
      revision: 0,
      rejectionReason: "Not reopening this role.",
    });

    expect(setup.state.posting.status).toBe("ARCHIVED");
    expect(setup.state.posting.deadline).toBe(originalDeadline);
    expect(setup.state.request?.status).toBe("REJECTED");
  });

  test("unarchive UI uses the shared themed date picker and semantic tokens", () => {
    const modalSource = readFileSync(
      new URL("../../components/jobs/unarchive-job-modal.tsx", import.meta.url),
      "utf8"
    );
    const menuSource = readFileSync(
      new URL("../../components/jobs/job-status-menu.tsx", import.meta.url),
      "utf8"
    );
    const serviceSource = readFileSync(
      new URL("./unarchive-job.ts", import.meta.url),
      "utf8"
    );
    expect(modalSource).toMatch(/DatePickerField/);
    expect(modalSource).toMatch(/New Application Deadline/);
    expect(modalSource).toMatch(/bg-surface-secondary/);
    expect(modalSource).toMatch(/text-foreground/);
    expect(modalSource).toMatch(/text-muted/);
    expect(modalSource).not.toMatch(/bg-(white|black)|text-(white|black)/);
    expect(menuSource).toMatch(/Unarchive/);
    expect(serviceSource).not.toMatch(/scoreResult|tasks\.trigger/);
  });
});
