import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/jobs/require-api", () => ({ requireApiMember: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { profile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } } }));
vi.mock("@/lib/profile/profile-queries", () => ({ getProfileModel: vi.fn() }));
vi.mock("@/lib/profile/to-profile-input", () => ({ toProfileModel: vi.fn((value) => value) }));
vi.mock("@/lib/profile/profile-diff", () => ({ diffProfileRows: vi.fn(() => ({ removedStored: [] })) }));
vi.mock("@/lib/uploads/storage", () => ({ deleteRemovedStoredFiles: vi.fn() }));

import { PUT } from "@/app/api/profile/route";
import { requireApiMember } from "@/lib/jobs/require-api";
import { prisma } from "@/lib/prisma";
import { USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";
import { resolvePhonePlan } from "@/lib/profile/phone";

const profile = {
  phone: "+6790123456", campuses: ["Laucala Campus"], bio: "", skills: ["Python"],
  degrees: [{ name: "BSc", gpa: 3, documentType: "transcript", document: {
    name: "transcript.pdf", stored: "3f2504e0-4f89-41d3-9a0c-0305e82c3301.pdf", type: "application/pdf", size: 100,
  } }],
  certificates: [], socialLinks: [], projectLinks: [],
};

function request(changes: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/profile", { method: "PUT", body: JSON.stringify({ ...profile, ...changes }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireApiMember).mockResolvedValue({ ok: true, session: { user: { id: "member-1" } } } as Awaited<ReturnType<typeof requireApiMember>>);
  vi.mocked(prisma.profile.create).mockResolvedValue({ id: "profile-1" } as Awaited<ReturnType<typeof prisma.profile.create>>);
  vi.mocked(prisma.profile.update).mockResolvedValue({ id: "profile-1" } as Awaited<ReturnType<typeof prisma.profile.update>>);
});

describe("PUT /api/profile campus phone enforcement", () => {
  test.each([
    { phone: "+6851234567" }, { phone: "+679123456" }, { phone: "+67912345678" },
    { phone: "+67912a4567" }, { phone: "+679123 4567" }, { phone: "+6791234567 " },
    { phone: "1234567" }, { phone: "+6791" }, { phone: "+685" }, { phone: 6791234567 },
    { campuses: [] }, { campuses: ["Unknown Campus"] }, { campuses: ["Laucala Campus", "Samoa Campus"] },
    { phone: "+68312345", campuses: ["Niue Campus"] },
  ])("rejects tampered/legacy invalid data before database access: %j", async (changes) => {
    const response = await PUT(request(changes));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    expect(prisma.profile.create).not.toHaveBeenCalled();
    expect(prisma.profile.update).not.toHaveBeenCalled();
  });

  test.each(["", "+679"])("creates a profile and removes an existing phone with %j, storing null", async (phone) => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    expect((await PUT(request({ phone }))).status).toBe(200);
    expect(prisma.profile.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ phone: null }),
    }));
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ id: "profile-1", phone: profile.phone } as Awaited<ReturnType<typeof prisma.profile.findUnique>>);
    expect((await PUT(request({ phone }))).status).toBe(200);
    expect(prisma.profile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ phone: null }),
    }));
  });

  test("accepts every campus and every permitted length through the API", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    for (const campus of USP_CAMPUSES_CENTRES) {
      const plan = resolvePhonePlan([campus])!;
      for (const phone of ["", plan.callingCode]) {
        expect((await PUT(request({ campuses: [campus], phone }))).status).toBe(200);
        expect(prisma.profile.create).toHaveBeenLastCalledWith(expect.objectContaining({
          data: expect.objectContaining({ campuses: [campus], phone: null }),
        }));
      }
      for (const length of plan.nationalLengths) {
        const phone = plan.callingCode + "0".repeat(length);
        expect((await PUT(request({ campuses: [campus], phone }))).status, `${campus}: ${length}`).toBe(200);
        expect(prisma.profile.create).toHaveBeenLastCalledWith(expect.objectContaining({
          data: expect.objectContaining({ campuses: [campus], phone }),
        }));
      }
    }
  });

  test("stores canonical strings with leading zeros on create and update", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    expect((await PUT(request({ campuses: ["Laucala"] }))).status).toBe(200);
    expect(prisma.profile.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ phone: "+6790123456", campuses: ["Laucala Campus"] }),
    }));
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ id: "profile-1" } as Awaited<ReturnType<typeof prisma.profile.findUnique>>);
    expect((await PUT(request({}))).status).toBe(200);
    expect(prisma.profile.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "profile-1" }, data: expect.objectContaining({ phone: "+6790123456" }),
    }));
  });
});
