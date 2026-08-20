import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { splitName } from "@/lib/user-name";

describe("splitName", () => {
  it("splits a full name into first and last", () => {
    const result = splitName("John Doe");
    assert.equal(result.first, "John");
    assert.equal(result.last, "Doe");
  });

  it("handles single name", () => {
    const result = splitName("John");
    assert.equal(result.first, "John");
    assert.equal(result.last, "");
  });

  it("handles multiple last names", () => {
    const result = splitName("John van der Doe");
    assert.equal(result.first, "John");
    assert.equal(result.last, "van der Doe");
  });

  it("handles null input", () => {
    const result = splitName(null);
    assert.equal(result.first, "");
    assert.equal(result.last, "");
  });

  it("handles undefined input", () => {
    const result = splitName(undefined);
    assert.equal(result.first, "");
    assert.equal(result.last, "");
  });

  it("handles empty string", () => {
    const result = splitName("");
    assert.equal(result.first, "");
    assert.equal(result.last, "");
  });

  it("trims whitespace", () => {
    const result = splitName("  John  Doe  ");
    assert.equal(result.first, "John");
    assert.equal(result.last, "Doe");
  });
});
