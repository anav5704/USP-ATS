import { describe, expect, test } from "vitest";

import { JOB_TYPES, USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";
import { jobInputSchema } from "@/lib/jobs/job-schema";
import { JOB_TITLES, getJobTemplate } from "@/lib/jobs/job-templates";

const DEADLINE = "2030-01-01";
const CUSTOM_TITLE = "Zebrafish Husbandry Assistant";

const posting = (over: Record<string, unknown> = {}) => ({
  title: CUSTOM_TITLE,
  description: "Support the research team.",
  department: "SBM",
  jobType: "Part Time",
  campus: ["Laucala Campus"],
  gpaMin: null,
  degree: [],
  skills: [],
  hours: 10,
  hourlyPay: 15,
  benefit: "",
  deadline: DEADLINE,
  ...over,
});

type ParseResult = { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } };

const issues = (result: ParseResult) =>
  result.success ? [] : (result.error?.issues ?? []).map((i) => `${i.path.join(".")}: ${i.message}`);

const firstIssue = (result: ParseResult) =>
  result.success ? "" : (result.error?.issues[0]?.message ?? "");

const at = (n: number) => "x".repeat(n);

const payFor = (jobType: string) => (jobType === "Volunteer" ? 0 : 15);

describe("Job CRUD", () => {
  test("TC-23", () => {
    expect(firstIssue(jobInputSchema.safeParse(posting({ title: "" })))).toBe("Job title is required");
    expect(firstIssue(jobInputSchema.safeParse(posting({ title: "   " })))).toBe("Job title is required");
    expect(jobInputSchema.safeParse(posting({ title: "a" })).success).toBe(true);
    expect(jobInputSchema.safeParse(posting({ title: at(200) })).success).toBe(true);
    expect(firstIssue(jobInputSchema.safeParse(posting({ title: at(201) })))).toBe("Job title is too long");

    expect(firstIssue(jobInputSchema.safeParse(posting({ description: "   " })))).toBe(
      "Job description is required"
    );
    expect(jobInputSchema.safeParse(posting({ description: "d" })).success).toBe(true);
    expect(jobInputSchema.safeParse(posting({ description: at(10000) })).success).toBe(true);
    expect(firstIssue(jobInputSchema.safeParse(posting({ description: at(10001) })))).toBe(
      "Job description is too long"
    );
  });

  test("TC-24", () => {
    for (const department of ["SAFE", "SBM", "STEMP", "SAGEONS", "SoLaSS", "SPACE", "PTAFE", "PACE-SD"]) {
      expect(jobInputSchema.safeParse(posting({ department })).success, department).toBe(true);
    }
    expect(firstIssue(jobInputSchema.safeParse(posting({ department: "INVALID" })))).toBe(
      "Select a department"
    );

    for (const jobType of JOB_TYPES) {
      expect(jobInputSchema.safeParse(posting({ jobType, hourlyPay: payFor(jobType) })).success, jobType).toBe(
        true
      );
    }
    expect(firstIssue(jobInputSchema.safeParse(posting({ jobType: "INVALID" })))).toBe("Select a job type");

    expect(JOB_TITLES.length).toBeGreaterThan(0);
    for (const title of JOB_TITLES) {
      const template = getJobTemplate(title)!;
      expect(
        jobInputSchema.safeParse(
          posting({ title, jobType: template.jobType, hourlyPay: payFor(template.jobType) })
        ).success,
        title
      ).toBe(true);

      const wrongType = JOB_TYPES.find((t) => t !== template.jobType);
      if (!wrongType) continue;
      const reported = issues(
        jobInputSchema.safeParse(posting({ title, jobType: wrongType, hourlyPay: payFor(wrongType) }))
      );
      expect(
        reported.some((issue) => issue.startsWith("jobType:") && issue.includes(template.jobType)),
        `"${title}" paired with ${wrongType}: ${JSON.stringify(reported)}`
      ).toBe(true);
    }

    for (const jobType of JOB_TYPES) {
      expect(
        jobInputSchema.safeParse(posting({ title: CUSTOM_TITLE, jobType, hourlyPay: payFor(jobType) })).success,
        jobType
      ).toBe(true);
    }
  });

  test("TC-25", () => {
    expect(firstIssue(jobInputSchema.safeParse(posting({ campus: [] })))).toBe(
      "Select at least one campus or centre"
    );
    expect(USP_CAMPUSES_CENTRES).toHaveLength(23);
    expect(jobInputSchema.safeParse(posting({ campus: ["Laucala Campus"] })).success).toBe(true);
    expect(jobInputSchema.safeParse(posting({ campus: [...USP_CAMPUSES_CENTRES] })).success).toBe(true);
    expect(jobInputSchema.safeParse(posting({ campus: ["Mars Base"] })).success).toBe(false);
    expect(jobInputSchema.safeParse(posting({ campus: ["", "Laucala Campus"] })).success).toBe(false);
  });

  test("TC-26", () => {
    expect(jobInputSchema.safeParse(posting({ gpaMin: null })).success).toBe(true);
    for (const gpaMin of [0, 2.5, 4.5]) {
      expect(jobInputSchema.safeParse(posting({ gpaMin })).success, String(gpaMin)).toBe(true);
    }
    for (const gpaMin of [4.6, -0.1]) {
      expect(firstIssue(jobInputSchema.safeParse(posting({ gpaMin }))), String(gpaMin)).toBe(
        "GPA Required must be between 0 and 4.5"
      );
    }
  });

  test("TC-27", () => {
    for (const hours of [1, 24, 168]) {
      expect(jobInputSchema.safeParse(posting({ hours })).success, String(hours)).toBe(true);
    }
    expect(firstIssue(jobInputSchema.safeParse(posting({ hours: "" })))).toBe("Enter the weekly hours");
    expect(firstIssue(jobInputSchema.safeParse(posting({ hours: "abc" })))).toBe("Enter the weekly hours");
    expect(firstIssue(jobInputSchema.safeParse(posting({ hours: 0 })))).toBe("Weekly hours must be at least 1");
    expect(firstIssue(jobInputSchema.safeParse(posting({ hours: -1 })))).toBe("Weekly hours must be at least 1");
    expect(firstIssue(jobInputSchema.safeParse(posting({ hours: 10.5 })))).toBe("Weekly hours must be a whole number");
    expect(firstIssue(jobInputSchema.safeParse(posting({ hours: 169 })))).toBe("Weekly hours cannot exceed 168");
  });

  test("TC-28", () => {
    expect(jobInputSchema.safeParse(posting({ jobType: "Volunteer", hourlyPay: 0 })).success).toBe(true);

    for (const jobType of JOB_TYPES.filter((t) => t !== "Volunteer")) {
      expect(issues(jobInputSchema.safeParse(posting({ jobType, hourlyPay: 0 }))), jobType).toContain(
        "hourlyPay: Hourly pay must be greater than 0 for non-volunteer jobs."
      );
    }

    expect(firstIssue(jobInputSchema.safeParse(posting({ hourlyPay: -1 })))).toBe(
      "Hourly pay cannot be negative."
    );
    expect(firstIssue(jobInputSchema.safeParse(posting({ hourlyPay: 1000001 })))).toBe("Hourly pay is too large");
    for (const pay of [0.01, 15, 1000000]) {
      expect(jobInputSchema.safeParse(posting({ hourlyPay: pay })).success, String(pay)).toBe(true);
    }

    expect(
      issues(jobInputSchema.safeParse({ ...posting({ jobType: "Part Time", hourlyPay: 0 }), title: "" }))
    ).toContain("hourlyPay: Hourly pay must be greater than 0 for non-volunteer jobs.");
  });

  test("TC-29", () => {
    expect(jobInputSchema.safeParse(posting({ deadline: "2030-01-01" })).success).toBe(true);
    expect(firstIssue(jobInputSchema.safeParse(posting({ deadline: "" })))).toBe("Deadline is required");
    for (const deadline of ["2026-02-30", "11/10/2026", "abc", "2030-13-01", "2030-1-1"]) {
      expect(firstIssue(jobInputSchema.safeParse(posting({ deadline }))), deadline).toBe("Enter a valid deadline");
    }
    expect(jobInputSchema.safeParse(posting({ deadline: "2028-02-29" })).success).toBe(true);
    expect(jobInputSchema.safeParse(posting({ deadline: "2027-02-29" })).success).toBe(false);
  });

  test("TC-30", () => {
    expect(jobInputSchema.safeParse(posting({ degree: [] })).success).toBe(true);
    expect(jobInputSchema.safeParse(posting({ skills: [] })).success).toBe(true);

    expect(jobInputSchema.safeParse(posting({ degree: Array.from({ length: 20 }, (_, i) => `D${i}`) })).success).toBe(
      true
    );
    expect(firstIssue(jobInputSchema.safeParse(posting({ degree: Array.from({ length: 21 }, (_, i) => `D${i}`) })))).toBe(
      "Too many degrees"
    );

    expect(jobInputSchema.safeParse(posting({ skills: Array.from({ length: 10 }, (_, i) => `S${i}`) })).success).toBe(
      true
    );
    expect(firstIssue(jobInputSchema.safeParse(posting({ skills: Array.from({ length: 11 }, (_, i) => `S${i}`) })))).toBe(
      "You can select up to 10 skills"
    );

    expect(firstIssue(jobInputSchema.safeParse(posting({ degree: ["  "] })))).toBe("Degree name is required");
    expect(firstIssue(jobInputSchema.safeParse(posting({ skills: [""] })))).toBe("Skill name is required");
  });
});