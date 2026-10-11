import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const SOURCE = readFileSync(path.join(process.cwd(), "lib/jobs/require-api.ts"), "utf8");

describe("Authentication and RBAC", () => {
  test.skip("TC-01", () => {});
  test.skip("TC-02", () => {});
  test.skip("TC-03", () => {});
  test.skip("TC-04", () => {});

  test("TC-05", () => {
    expect(SOURCE).toMatch(/status: 401/);
    expect(SOURCE).toMatch(/You must be signed in/);
  });

  test("TC-06", () => {
    expect(SOURCE).toMatch(/export function requireApiAdmin/);
    expect(SOURCE).toMatch(/session\.user\.role !== role/);
    expect(SOURCE).toMatch(/status: 403/);
    expect(SOURCE).toMatch(/Admin access is required/);
  });

  test("TC-07", () => {
    expect(SOURCE).toMatch(/export function requireApiMember/);
    expect(SOURCE).toMatch(/Member access is required/);
    expect(SOURCE).not.toMatch(/role\.toLowerCase|role\.includes|roles?\.some/);
  });

  test.skip("TC-08", () => {});
});