import assert from "node:assert/strict";
import test from "node:test";
import { gpaFilterSchema } from "@/lib/jobs/gpa-filter-schema";

test("optional GPA filter accepts inclusive boundaries and decimals", () => {
  for (const value of ["", "0", "2.5", "4.2", "4.5"]) {
    assert.equal(gpaFilterSchema.parse(value), value);
  }
  assert.equal(gpaFilterSchema.parse("  "), "");
});

test("GPA filter rejects out-of-range and nonnumeric values", () => {
  for (const value of ["-0.1", "-1", "4.6", "5", "NaN", "Infinity", "invalid"]) {
    const result = gpaFilterSchema.safeParse(value);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0].message, "GPA must be between 0 and 4.5.");
    }
  }
});

test("correcting or clearing invalid GPA removes its validation error", () => {
  assert.equal(gpaFilterSchema.safeParse("5").success, false);
  assert.equal(gpaFilterSchema.safeParse("4.2").success, true);
  assert.equal(gpaFilterSchema.safeParse("").success, true);
});
