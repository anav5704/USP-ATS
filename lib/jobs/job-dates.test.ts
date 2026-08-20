import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deadlineAtEndOfFijiDay,
  startOfFijiDay,
  toFijiDate,
  todayInFiji,
  daysUntilFijiDate,
  deadlineRemainingLabel,
} from "@/lib/jobs/job-dates";

describe("toFijiDate", () => {
  it("formats a date in Fiji timezone", () => {
    const date = new Date("2026-06-15T10:00:00Z");
    const result = toFijiDate(date);
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date in Fiji", () => {
    const today = todayInFiji();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("deadlineAtEndOfFijiDay", () => {
  it("creates a date at 23:59:59.999 in Fiji timezone", () => {
    const result = deadlineAtEndOfFijiDay("2026-06-15");
    assert.equal(result instanceof Date, true);
    assert.equal(result.getHours(), 23);
    assert.equal(result.getMinutes(), 59);
  });
});

describe("startOfFijiDay", () => {
  it("creates a date at 00:00:00.000 in Fiji timezone", () => {
    const result = startOfFijiDay("2026-06-15");
    assert.equal(result instanceof Date, true);
    assert.equal(result.getHours(), 0);
    assert.equal(result.getMinutes(), 0);
  });
});

describe("daysUntilFijiDate", () => {
  it("returns 0 for today", () => {
    const today = todayInFiji();
    const [year, month, day] = today.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    assert.equal(daysUntilFijiDate(date), 0);
  });

  it("returns positive number for future date", () => {
    const today = todayInFiji();
    const [year, month, day] = today.split("-").map(Number);
    const future = new Date(Date.UTC(year, month - 1, day + 5));
    const result = daysUntilFijiDate(future);
    assert.equal(result > 0, true);
  });
});

describe("deadlineRemainingLabel", () => {
  it("shows 'Closes today' for today", () => {
    const today = todayInFiji();
    const [year, month, day] = today.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const result = deadlineRemainingLabel(date);
    assert.equal(result.expired, false);
    assert.equal(result.label, "Closes today");
  });

  it("shows 'Closes in 1 day' for tomorrow", () => {
    const today = todayInFiji();
    const [year, month, day] = today.split("-").map(Number);
    const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
    const result = deadlineRemainingLabel(tomorrow);
    assert.equal(result.expired, false);
    assert.equal(result.label, "Closes in 1 day");
  });

  it("shows 'Closes in N days' for future dates", () => {
    const today = todayInFiji();
    const [year, month, day] = today.split("-").map(Number);
    const future = new Date(Date.UTC(year, month - 1, day + 5));
    const result = deadlineRemainingLabel(future);
    assert.equal(result.expired, false);
    assert.equal(result.label, "Closes in 5 days");
  });

  it("shows 'Deadline passed' for past dates", () => {
    const today = todayInFiji();
    const [year, month, day] = today.split("-").map(Number);
    const past = new Date(Date.UTC(year, month - 1, day - 1));
    const result = deadlineRemainingLabel(past);
    assert.equal(result.expired, true);
    assert.equal(result.label, "Deadline passed");
  });
});
