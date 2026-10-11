import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { pendingReviewData } from "@/lib/jobs/approval-schema";
import { ArchiveJobError, archiveJobRecord } from "@/lib/jobs/archive-job";
import { isJobOpenForApplication } from "@/lib/applications/application-rules";
import { reviewJob } from "@/lib/jobs/review-job";
import { deadlineAtEndOfFijiDay, startOfFijiDay, todayInFiji } from "@/lib/jobs/job-dates";

type Posting = { id: string; pendingModificationId: string | null };

function recorder(postings: Posting[], applicationCounts: Record<string, number> = {}) {
  const statusUpdates: { id: string; status: string }[] = [];
  return {
    statusUpdates,
    findPosting: async (id: string) => postings.find((p) => p.id === id) ?? null,
    updateStatus: async (id: string, status: string) => {
      statusUpdates.push({ id, status });
      void applicationCounts[id];
    },
  };
}

describe("Job CRUD", () => {
  test("TC-31", async () => {
    const zero = [{ id: "job-1", pendingModificationId: null }];
    const zeroDeps = recorder(zero, { "job-1": 0 });
    await expect(archiveJobRecord(zeroDeps.findPosting, zeroDeps.updateStatus, "job-1")).resolves.toBe("archived");
    expect(zeroDeps.statusUpdates).toEqual([{ id: "job-1", status: "ARCHIVED" }]);
    expect(zero).toHaveLength(1);

    const withApps = [{ id: "job-2", pendingModificationId: null }];
    const appsDeps = recorder(withApps, { "job-2": 3 });
    await expect(archiveJobRecord(appsDeps.findPosting, appsDeps.updateStatus, "job-2")).resolves.toBe("archived");
    expect(appsDeps.statusUpdates).toEqual([{ id: "job-2", status: "ARCHIVED" }]);
    expect(withApps).toHaveLength(1);

    for (const count of [0, 1, 3, 50]) {
      const postings: Posting[] = [{ id: `job-${count}`, pendingModificationId: null }];
      const deps = recorder(postings, { [`job-${count}`]: count });
      await expect(
        archiveJobRecord(deps.findPosting, deps.updateStatus, `job-${count}`)
      ).resolves.toBe("archived");
      expect(deps.statusUpdates[0]?.status, `applicationCount ${count}`).toBe("ARCHIVED");
    }

    const emptyDeps = recorder([]);
    await expect(archiveJobRecord(emptyDeps.findPosting, emptyDeps.updateStatus, "missing")).resolves.toBeNull();
    expect(emptyDeps.statusUpdates).toHaveLength(0);

    const pending = [{ id: "job-3", pendingModificationId: "mod-1" }];
    const pendingDeps = recorder(pending);
    await expect(
      archiveJobRecord(pendingDeps.findPosting, pendingDeps.updateStatus, "job-3")
    ).rejects.toBeInstanceOf(ArchiveJobError);
    await expect(
      archiveJobRecord(pendingDeps.findPosting, pendingDeps.updateStatus, "job-3")
    ).rejects.toMatchObject({
      status: 409,
      message: "A posting with a pending modification cannot be archived.",
    });
    expect(pendingDeps.statusUpdates).toHaveLength(0);

    const source = readFileSync(new URL("./archive-job.ts", import.meta.url), "utf8");
    expect(source).toMatch(/PostingStatus\.ARCHIVED/);
    expect(source).not.toMatch(/jobPosting\.delete|deleteMany/);
  });

  test("TC-32", async () => {
    const created = pendingReviewData("admin-1");

    expect(created.status).toBe("PENDING_APPROVAL");
    expect(created.requestedById).toBe("admin-1");
    expect(created.approvedById).toBeNull();
    expect(created.rejectionReason).toBeNull();

    expect(isJobOpenForApplication({ status: created.status, deadline: new Date() })).toBe(false);

    const updates: { status: string }[] = [];
    const posting = {
      id: "job-1",
      status: "PENDING_APPROVAL",
      revision: 0,
      createdById: "admin-1",
      requestedById: "admin-1",
      title: "Research Assistant",
      description: "Support the research team.",
      department: "SBM",
      jobType: "Part Time",
      campus: ["Laucala Campus"],
      gpaMin: null,
      degree: [],
      skills: [],
      hours: 10,
      hourlyPay: 15,
      benefit: null,
      deadline: new Date(Date.now() + 7 * 86400000),
    };
    // Only the fields reviewJob reads are supplied; the client is narrowed so
    // the fake satisfies the injected repository signature.
    const jobs = {
      findUnique: async () => posting,
      updateMany: async ({ data }: { data: { status: string } }) => {
        updates.push(data);
        return { count: 1 };
      },
    } as unknown as Parameters<typeof reviewJob>[0];

    await expect(
      reviewJob(jobs, "job-1", "admin-2", { decision: "approve", revision: 0 })
    ).resolves.toBeUndefined();
    expect(updates[0]?.status).toBe("ACTIVE");

    await expect(
      reviewJob(jobs, "job-1", "admin-1", { decision: "approve", revision: 0 })
    ).rejects.toMatchObject({ status: 403 });

    const today = todayInFiji();
    const startOfToday = startOfFijiDay(today);
    expect(deadlineAtEndOfFijiDay(today).getTime()).toBeGreaterThan(startOfToday.getTime());
    expect(startOfToday.getTime() - new Date(`${today}T00:00:00.000Z`).getTime()).toBe(-12 * 3600 * 1000);
  });
});
