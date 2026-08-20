import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { jobInputSchema } from "@/lib/jobs/job-schema";

function baseInput() {
  return {
    title: "Teaching Assistant",
    description: "Assist with tutorials and marking",
    department: "STEMP" as const,
    jobType: "Part Time" as const,
    campus: ["Laucala"],
    gpaMin: null,
    degree: ["Bachelor of Science (Computer Science)"],
    skills: ["Python", "Communication"],
    hours: 10,
    hourlyPay: 15,
    deadline: "2026-12-31",
  };
}

describe("jobInputSchema title validation", () => {
  it("accepts a valid title", () => {
    assert.equal(jobInputSchema.safeParse(baseInput()).success, true);
  });

  it("rejects empty title", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), title: "" }).success,
      false
    );
  });

  it("rejects title over 200 characters", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), title: "a".repeat(201) }).success,
      false
    );
  });
});

describe("jobInputSchema description validation", () => {
  it("rejects empty description", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), description: "" }).success,
      false
    );
  });

  it("rejects description over 10000 characters", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), description: "a".repeat(10001) }).success,
      false
    );
  });
});

describe("jobInputSchema campus validation", () => {
  it("requires at least one campus", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), campus: [] }).success,
      false
    );
  });

  it("rejects unknown campus names", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), campus: ["Atlantis"] }).success,
      false
    );
  });

  it("accepts valid campus names", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), campus: ["Laucala", "Lautoka"] }).success,
      true
    );
  });
});

describe("jobInputSchema GPA validation", () => {
  it("allows null gpaMin", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), gpaMin: null }).success,
      true
    );
  });

  it("accepts valid gpaMin between 0 and 4.5", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), gpaMin: 3.0 }).success,
      true
    );
  });

  it("rejects gpaMin below 0", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), gpaMin: -0.1 }).success,
      false
    );
  });

  it("rejects gpaMin above 4.5", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), gpaMin: 4.6 }).success,
      false
    );
  });
});

describe("jobInputSchema hours and pay validation", () => {
  it("accepts valid hours and pay", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), hours: 20, hourlyPay: 15 }).success,
      true
    );
  });

  it("rejects hours below 1", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), hours: 0 }).success,
      false
    );
  });

  it("rejects hours above 168", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), hours: 169 }).success,
      false
    );
  });

  it("rejects non-integer hours", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), hours: 10.5 }).success,
      false
    );
  });

  it("rejects negative hourly pay", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), hourlyPay: -1 }).success,
      false
    );
  });
});

describe("jobInputSchema deadline validation", () => {
  it("accepts a valid calendar date", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), deadline: "2026-06-15" }).success,
      true
    );
  });

  it("rejects empty deadline", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), deadline: "" }).success,
      false
    );
  });

  it("rejects invalid date formats", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), deadline: "not-a-date" }).success,
      false
    );
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), deadline: "2026-13-01" }).success,
      false
    );
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), deadline: "2026-02-30" }).success,
      false
    );
  });
});

describe("jobInputSchema department and jobType validation", () => {
  it("rejects unknown department", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), department: "Unknown" }).success,
      false
    );
  });

  it("rejects unknown job type", () => {
    assert.equal(
      jobInputSchema.safeParse({ ...baseInput(), jobType: "Contract" }).success,
      false
    );
  });
});
