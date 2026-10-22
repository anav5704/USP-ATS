import { describe, expect, test } from "vitest";

import { gpaFilterSchema } from "@/lib/jobs/gpa-filter-schema";
import {
  EMPTY_STUDENT_JOB_FILTERS,
  jobFiltersToSearchParams,
  searchParamsToStudentJobFilters,
} from "@/lib/jobs/job-filters";
import { parsePageParams } from "@/lib/pagination";
import { isJobOpenForApplication } from "@/lib/applications/application-rules";
import { startOfFijiDay, todayInFiji } from "@/lib/jobs/job-dates";

const filters = (query: string) => searchParamsToStudentJobFilters(new URLSearchParams(query));

describe("Job Feed", () => {
  test("TC-17", () => {
    for (const value of ["", "0", "2.5", "4.2", "4.5"]) {
      expect(gpaFilterSchema.safeParse(value).success, value).toBe(true);
    }
    for (const value of ["-0.1", "-1", "4.6", "5", "NaN", "Infinity", "invalid"]) {
      expect(gpaFilterSchema.safeParse(value).success, value).toBe(false);
      expect(gpaFilterSchema.safeParse(value).error?.issues[0]?.message, value).toMatch(/0 and 4\.5/);
    }
  });

  test("TC-18", () => {
    expect(filters("").search).toBe("");
    expect(filters("search=%20%20lab%20%20").search).toBe("lab");
    expect(filters("search=%3Cscript%3Ealert(1)%3C%2Fscript%3E").search).toBe("<script>alert(1)</script>");
    const long = "a".repeat(5000);
    expect(filters(`search=${long}`).search).toBe(long);
  });

  test("TC-19", () => {
    expect(filters("campuses=Laucala%20Campus").campuses).toEqual(["Laucala Campus"]);
    expect(filters("campuses=Laucala%20Campus&campuses=Emalus%20Campus").campuses).toEqual([
      "Laucala Campus",
      "Emalus Campus",
    ]);
    expect(filters("campuses=&campuses=Laucala%20Campus&campuses=").campuses).toEqual(["Laucala Campus"]);
    expect(filters("jobType=Internship").jobType).toBe("Internship");
    expect(filters("jobType=").jobType).toBe("");
    expect(
      jobFiltersToSearchParams({
        ...EMPTY_STUDENT_JOB_FILTERS,
        search: "  lab  ",
        campuses: ["Laucala Campus"],
      })
    ).toBe("search=lab&campuses=Laucala+Campus");
  });

  test("TC-20", () => {
    for (const page of ["0", "-1", "abc", ""]) {
      expect(parsePageParams(new URLSearchParams(`page=${page}`), 12).page, `page=${page}`).toBe(1);
    }
    expect(parsePageParams(new URLSearchParams("page=3"), 12).page).toBe(3);
    expect(parsePageParams(new URLSearchParams("pageSize=999"), 12).pageSize).toBe(50);
    expect(parsePageParams(new URLSearchParams("pageSize=25"), 12).pageSize).toBe(25);
    for (const pageSize of ["0", "-5", "abc", ""]) {
      expect(parsePageParams(new URLSearchParams(`pageSize=${pageSize}`), 12).pageSize, pageSize).toBe(12);
    }
  });

  test("TC-21", () => {
    const start = startOfFijiDay(todayInFiji());

    expect(isJobOpenForApplication({ status: "ACTIVE", deadline: start })).toBe(true);
    expect(isJobOpenForApplication({ status: "ACTIVE", deadline: new Date(start.getTime() + 86400000) })).toBe(
      true
    );
    expect(isJobOpenForApplication({ status: "ACTIVE", deadline: new Date(start.getTime() - 86400000) })).toBe(
      false
    );
    for (const status of ["PENDING_APPROVAL", "ARCHIVED", "REJECTED"]) {
      expect(isJobOpenForApplication({ status, deadline: start }), status).toBe(false);
    }
    expect(
      isJobOpenForApplication({ status: "ACTIVE", deadline: start, pendingModificationId: "mod-1" })
    ).toBe(false);
  });

  test("TC-22", () => {
    for (const value of ["99", "-5", "abc"]) {
      expect(gpaFilterSchema.safeParse(filters(`gpaMin=${value}`).gpaMin).success, `gpaMin=${value}`).toBe(true);
    }
    expect(filters("campuses=Mars%20Base").campuses).toEqual([]);
    expect(filters("jobType=Astronaut").jobType).toBe("");
  });
});
