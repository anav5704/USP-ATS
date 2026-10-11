import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

import {
  ADMIN_APPLICATION_STATUSES,
  APPLICATION_STATUSES,
  adminApplicationStatusSchema,
  createApplicationSchema,
  type ApplicationStatus,
} from "@/lib/applications/application-schema";
import {
  allowedAdminStatusTargets,
  blocksReapplication,
  canAdminChangeStatus,
  canWithdraw,
  isJobOpenForApplication,
} from "@/lib/applications/application-rules";

type ParseResult = { success: boolean; error?: { issues: { message: string }[] } };

const firstIssue = (result: ParseResult) =>
  result.success ? "" : (result.error?.issues[0]?.message ?? "");

describe("Job Application", () => {
  test("TC-33", () => {
    for (const coverLetter of ["", "   ", "\n\t "]) {
      expect(
        firstIssue(createApplicationSchema.safeParse({ jobId: "job-1", coverLetter })),
        JSON.stringify(coverLetter)
      ).toBe("Cover letter is required");
    }
    expect(createApplicationSchema.safeParse({ jobId: "job-1", coverLetter: "a" }).success).toBe(true);
    expect(createApplicationSchema.safeParse({ jobId: "job-1", coverLetter: "a".repeat(2000) }).success).toBe(
      true
    );
    expect(firstIssue(createApplicationSchema.safeParse({ jobId: "job-1", coverLetter: "a".repeat(2001) }))).toBe(
      "Cover letter is too long"
    );
    expect(firstIssue(createApplicationSchema.safeParse({ jobId: "", coverLetter: "a" }))).toBe(
      "Job id is required"
    );
  });

  test("TC-34", () => {
    const expected: Record<ApplicationStatus, boolean> = {
      APPLIED: true,
      SHORTLISTED: true,
      ACCEPTED: true,
      DECLINED: true,
      WITHDRAWN: false,
    };
    for (const status of APPLICATION_STATUSES) {
      expect(blocksReapplication(status), status).toBe(expected[status]);
    }
  });

  test("TC-35", () => {
    const deadline = new Date(Date.now() + 86400000);

    for (const status of ["ARCHIVED", "PENDING_APPROVAL", "REJECTED"]) {
      expect(isJobOpenForApplication({ status, deadline }), status).toBe(false);
    }
    expect(isJobOpenForApplication({ status: "ACTIVE", deadline, pendingModificationId: "mod-1" })).toBe(false);
    expect(isJobOpenForApplication({ status: "ACTIVE", deadline: new Date(Date.now() - 86400000) })).toBe(false);
    expect(isJobOpenForApplication({ status: "ACTIVE", deadline })).toBe(true);
  });

  test("TC-36", () => {
    const expected: Record<ApplicationStatus, boolean> = {
      APPLIED: true,
      SHORTLISTED: false,
      ACCEPTED: false,
      DECLINED: false,
      WITHDRAWN: false,
    };
    for (const status of APPLICATION_STATUSES) {
      expect(canWithdraw(status), status).toBe(expected[status]);
    }
  });

  test("TC-37", () => {
    const source = readFileSync(
      new URL("../../app/api/applications/[id]/withdraw/route.ts", import.meta.url),
      "utf8"
    );
    expect(source).toMatch(/studentId:\s*guard\.session\.user\.id/);
    expect(source).toMatch(/status:\s*"APPLIED"/);
    expect(source).toMatch(/status:\s*409/);
  });

  test("TC-38", () => {
    expect([...ADMIN_APPLICATION_STATUSES]).toEqual(["SHORTLISTED", "ACCEPTED", "DECLINED"]);
    for (const status of ADMIN_APPLICATION_STATUSES) {
      expect(adminApplicationStatusSchema.safeParse(status).success, status).toBe(true);
    }
    for (const status of ["APPLIED", "WITHDRAWN", "pending", ""]) {
      expect(adminApplicationStatusSchema.safeParse(status).success, status).toBe(false);
    }
  });

  test("TC-39", () => {
    expect(allowedAdminStatusTargets("APPLIED")).toEqual(["SHORTLISTED", "ACCEPTED", "DECLINED"]);
    expect(allowedAdminStatusTargets("SHORTLISTED")).toEqual(["ACCEPTED", "DECLINED"]);

    for (const status of ["ACCEPTED", "DECLINED", "WITHDRAWN"] as const) {
      expect(allowedAdminStatusTargets(status), status).toEqual([]);
      for (const target of ADMIN_APPLICATION_STATUSES) {
        expect(canAdminChangeStatus(status, target), `${status} -> ${target}`).toBe(false);
      }
    }

    const allowed: Record<ApplicationStatus, string[]> = {
      APPLIED: ["SHORTLISTED", "ACCEPTED", "DECLINED"],
      SHORTLISTED: ["ACCEPTED", "DECLINED"],
      ACCEPTED: [],
      DECLINED: [],
      WITHDRAWN: [],
    };
    for (const from of APPLICATION_STATUSES) {
      for (const to of ADMIN_APPLICATION_STATUSES) {
        expect(canAdminChangeStatus(from, to), `${from} -> ${to}`).toBe(allowed[from].includes(to));
      }
    }
  });

  test("TC-40", () => {
    const source = readFileSync(
      new URL("../applications/application-list-queries.ts", import.meta.url),
      "utf8"
    );
    expect(source).toMatch(/studentId:\s*userId/);
  });

  test("TC-41", () => {
    const source = readFileSync(
      new URL("../../components/applications/application-detail-modal.tsx", import.meta.url),
      "utf8"
    );
    const notice = source.match(/message=\{`You are withdrawing[\s\S]*?`\}/)?.[0] ?? "";

    expect(notice.length).toBeGreaterThan(0);
    expect(blocksReapplication("WITHDRAWN")).toBe(false);
    expect(notice).not.toMatch(/will not be able to apply/i);
  });
});