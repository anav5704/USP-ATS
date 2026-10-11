import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { pendingReviewData } from "@/lib/jobs/approval-schema";
import { ArchiveJobError, archiveJobRecord } from "@/lib/jobs/archive-job";
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

  test("TC-32", () => {
    expect(pendingReviewData("admin-1").status).toBe("ACTIVE");

    const today = todayInFiji();
    const startOfToday = startOfFijiDay(today);
    expect(deadlineAtEndOfFijiDay(today).getTime()).toBeGreaterThan(startOfToday.getTime());
    expect(startOfToday.getTime() - new Date(`${today}T00:00:00.000Z`).getTime()).toBe(-12 * 3600 * 1000);
  });
});