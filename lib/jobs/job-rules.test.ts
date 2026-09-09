import assert from "node:assert/strict";
import test from "node:test";
import { JOB_TYPES, USP_CAMPUSES_CENTRES, USP_DEPARTMENTS } from "@/lib/jobs/job-constants";
import { jobInputSchema, type JobInput } from "@/lib/jobs/job-schema";
import { getJobTemplate, getJobTemplateTransition, JOB_TEMPLATES } from "@/lib/jobs/job-templates";

const job: JobInput = {
  title: "Custom role",
  description: "Support university activities",
  department: USP_DEPARTMENTS[0],
  jobType: "Part Time",
  campus: [USP_CAMPUSES_CENTRES[0]],
  gpaMin: null,
  degree: [],
  skills: [],
  hours: 10,
  hourlyPay: 15,
  benefit: "",
  deadline: "2027-01-01",
};

test("shared create/update schema validates pay for every job type", () => {
  for (const jobType of JOB_TYPES) {
    for (const hourlyPay of [-1, 0, 0.01, 15]) {
      const result = jobInputSchema.safeParse({ ...job, jobType, hourlyPay });
      assert.equal(result.success, hourlyPay > 0 || (jobType === "Volunteer" && hourlyPay === 0));
      if (!result.success) {
        assert.deepEqual(result.error.issues[0].path, ["hourlyPay"]);
        assert.equal(result.error.issues[0].message, hourlyPay < 0
          ? "Hourly pay cannot be negative."
          : "Hourly pay must be greater than 0 for non-volunteer jobs.");
      }
    }
  }
});

test("every template has valid defaults and rejects a forged job type", () => {
  for (const [title, template] of Object.entries(JOB_TEMPLATES)) {
    assert.equal(jobInputSchema.safeParse({ ...job, ...template, title }).success, true);
    const jobType = template.jobType === "Volunteer" ? "Part Time" : "Volunteer";
    assert.equal(jobInputSchema.safeParse({ ...job, ...template, title, jobType }).success, false);
  }
});

test("pay feedback works while unrelated required fields are unfinished", () => {
  for (const jobType of JOB_TYPES) {
    for (const hourlyPay of [0, -1, 15, 0]) {
      const result = jobInputSchema.safeParse({ jobType, hourlyPay });
      assert.equal(result.success, false);
      if (result.success) continue;
      const payError = result.error.issues.find((issue) => issue.path[0] === "hourlyPay");
      assert.equal(payError?.message, hourlyPay < 0
        ? "Hourly pay cannot be negative."
        : hourlyPay === 0 && jobType !== "Volunteer"
          ? "Hourly pay must be greater than 0 for non-volunteer jobs."
          : undefined);
    }
  }
});

test("template type changes revalidate retained zero pay", () => {
  const current = { ...JOB_TEMPLATES["Teaching Assistant"], hourlyPay: 0 };
  for (const title of ["Teaching Assistant", "Peer Mentor", "Teaching Assistant"]) {
    const { updates } = getJobTemplateTransition(title, current, {});
    Object.assign(current, updates);
    const result = jobInputSchema.safeParse({ ...current, title });
    assert.equal(result.success, false); // Other required fields are still missing.
    if (result.success) continue;
    assert.equal(result.error.issues.some((issue) => issue.path[0] === "hourlyPay"),
      current.jobType !== "Volunteer");
  }
});

test("title transitions force type while retaining manually edited fields", () => {
  const current = { ...JOB_TEMPLATES["Peer Mentor"], jobType: "Internship" as const, hourlyPay: 25, hours: 12 };
  const { updates } = getJobTemplateTransition("Teaching Assistant", current, {});
  assert.deepEqual(updates, { jobType: JOB_TEMPLATES["Teaching Assistant"].jobType });
  assert.deepEqual(getJobTemplateTransition("Custom role", current, {}).updates, {});
});

test("switching volunteer and paid templates updates untouched pay defaults", () => {
  const volunteer = JOB_TEMPLATES["Peer Mentor"];
  const paid = JOB_TEMPLATES["Teaching Assistant"];
  assert.equal(getJobTemplateTransition("Teaching Assistant", volunteer, volunteer).updates.hourlyPay, paid.hourlyPay);
  assert.equal(getJobTemplateTransition("Peer Mentor", paid, paid).updates.hourlyPay, 0);
});

test("custom titles, including object property names, have no forced type", () => {
  for (const title of ["Custom role", "constructor", "toString", "__proto__"]) {
    assert.equal(getJobTemplate(title), undefined);
    assert.equal(jobInputSchema.safeParse({ ...job, title }).success, true);
  }
});
