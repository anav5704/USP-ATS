import assert from "node:assert/strict";
import test from "node:test";
import { PostingStatus } from "@/generated/prisma/client";
import {
  archiveJobRecord,
  ArchiveJobError,
} from "@/lib/jobs/archive-job";

for (const applicationCount of [0, 3]) {
  test(`archives a posting with ${applicationCount} applications without deleting data`, async () => {
    const updates: Array<{ id: string; status: PostingStatus }> = [];

    const outcome = await archiveJobRecord(
      async () => ({
        id: "job-1",
        pendingModificationId: null,
        applicationCount,
      }),
      async (id, status) => {
        updates.push({ id, status });
      },
      "job-1"
    );

    assert.equal(outcome, "archived");
    assert.deepEqual(updates, [
      { id: "job-1", status: PostingStatus.ARCHIVED },
    ]);
  });
}

test("returns null when the posting does not exist", async () => {
  let updated = false;
  const outcome = await archiveJobRecord(
    async () => null,
    async () => {
      updated = true;
    },
    "missing"
  );

  assert.equal(outcome, null);
  assert.equal(updated, false);
});

test("does not archive a posting with a pending modification", async () => {
  await assert.rejects(
    archiveJobRecord(
      async () => ({ id: "job-1", pendingModificationId: "request-1" }),
      async () => {
        assert.fail("status must not be updated");
      },
      "job-1"
    ),
    (error: unknown) =>
      error instanceof ArchiveJobError && error.status === 409
  );
});
