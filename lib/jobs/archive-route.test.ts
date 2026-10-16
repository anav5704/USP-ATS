import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/jobs/require-api", () => ({
  requireApiAdmin: vi.fn(),
}));

vi.mock("@/lib/jobs/archive-job", () => ({
  ArchiveJobError: class ArchiveJobError extends Error {
    constructor(public readonly status: number, message: string) {
      super(message);
    }
  },
  archiveJobPostingById: vi.fn(),
}));

import { POST } from "@/app/api/jobs/[id]/archive/route";
import { archiveJobPostingById } from "@/lib/jobs/archive-job";
import { requireApiAdmin } from "@/lib/jobs/require-api";

const mockedArchive = vi.mocked(archiveJobPostingById);
const mockedGuard = vi.mocked(requireApiAdmin);

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/jobs/[id]/archive", () => {
  test("returns 200 with the archive outcome after a successful mutation", async () => {
    mockedGuard.mockResolvedValue({
      ok: true,
      session: { user: { id: "admin-1" } },
    } as Awaited<ReturnType<typeof requireApiAdmin>>);
    mockedArchive.mockResolvedValue("archived");

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(mockedArchive).toHaveBeenCalledOnce();
    expect(mockedArchive).toHaveBeenCalledWith("job-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ outcome: "archived" });
  });

  test("returns a handled 500 response and records unexpected server errors", async () => {
    mockedGuard.mockResolvedValue({
      ok: true,
      session: { user: { id: "admin-1" } },
    } as Awaited<ReturnType<typeof requireApiAdmin>>);
    const failure = new Error("database unavailable");
    mockedArchive.mockRejectedValue(failure);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to archive the job posting",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Unable to archive job posting",
      { jobId: "job-1", error: failure }
    );
    consoleError.mockRestore();
  });
});
