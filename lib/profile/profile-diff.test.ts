import assert from "node:assert/strict";
import test from "node:test";
import { diffProfileRows, type ExistingProfileRows } from "@/lib/profile/profile-diff";
import type { ProfileInput } from "@/lib/profile/profile-schema";

function baseInput(): ProfileInput {
  return {
    phone: "+679 9000000",
    bio: "Bio",
    campuses: ["Laucala"],
    skills: ["Python"],
    degrees: [
      {
        name: "BSc Computer Science",
        gpa: 3.5,
        documentType: "transcript",
        document: {
          name: "transcript.pdf",
          stored: "stored-degree-1",
          type: "application/pdf",
          size: 100,
        },
      },
    ],
    certificates: [],
    socialLinks: [{ platform: "LinkedIn", url: "https://example.com/in/a" }],
    projectLinks: [{ title: "Portfolio", url: "https://example.com/a" }],
  };
}

function baseExisting(): ExistingProfileRows {
  return {
    degrees: [
      {
        id: "degree-1",
        name: "BSc Computer Science",
        gpa: 3.5,
        documentType: "TRANSCRIPT",
        fileName: "transcript.pdf",
        stored: "stored-degree-1",
        type: "application/pdf",
        size: 100,
      },
    ],
    certificates: [],
    socialLinks: [{ id: "link-1", platform: "LinkedIn", url: "https://example.com/in/a" }],
    profileLinks: [{ id: "plink-1", title: "Portfolio", url: "https://example.com/a" }],
  };
}

test("identical input produces an empty diff", () => {
  const diff = diffProfileRows(baseExisting(), baseInput());
  assert.equal(diff.degrees, undefined);
  assert.equal(diff.certificates, undefined);
  assert.equal(diff.socialLinks, undefined);
  assert.equal(diff.profileLinks, undefined);
  assert.deepEqual(diff.removedStored, []);
});

test("scalar-only edits produce no relation operations", () => {
  const input = { ...baseInput(), bio: "New bio", phone: "+679 9111111" };
  const diff = diffProfileRows(baseExisting(), input);
  assert.equal(diff.degrees, undefined);
  assert.equal(diff.socialLinks, undefined);
  assert.equal(diff.profileLinks, undefined);
});

test("edited degree scalars update in place without recreating", () => {
  const input = baseInput();
  input.degrees[0] = { ...input.degrees[0], gpa: 3.8 };
  const diff = diffProfileRows(baseExisting(), input);
  assert.equal(diff.degrees?.create, undefined);
  assert.equal(diff.degrees?.deleteMany, undefined);
  assert.equal(diff.degrees?.update?.length, 1);
  assert.equal(diff.degrees?.update?.[0].where.id, "degree-1");
  assert.deepEqual(diff.removedStored, []);
});

test("removed degree deletes the row and reports its stored file", () => {
  const input = { ...baseInput(), degrees: [] };
  const diff = diffProfileRows(baseExisting(), input);
  assert.deepEqual(diff.degrees?.deleteMany, { id: { in: ["degree-1"] } });
  assert.deepEqual(diff.removedStored, ["stored-degree-1"]);
});

test("added degree creates without touching existing rows", () => {
  const input = baseInput();
  input.degrees.push({
    name: "MSc Data",
    gpa: 4.0,
    documentType: "degree",
    document: {
      name: "degree.pdf",
      stored: "stored-degree-2",
      type: "application/pdf",
      size: 200,
    },
  });
  const diff = diffProfileRows(baseExisting(), input);
  assert.equal(diff.degrees?.update, undefined);
  assert.equal(diff.degrees?.deleteMany, undefined);
  assert.equal(diff.degrees?.create?.length, 1);
  assert.equal(diff.degrees?.create?.[0].stored, "stored-degree-2");
  assert.deepEqual(diff.removedStored, []);
});

test("changed social link url updates in place", () => {
  const input = baseInput();
  input.socialLinks = [{ platform: "LinkedIn", url: "https://example.com/in/b" }];
  const diff = diffProfileRows(baseExisting(), input);
  assert.equal(diff.socialLinks?.update?.[0].where.id, "link-1");
  assert.deepEqual(diff.socialLinks?.update?.[0].data, {
    url: "https://example.com/in/b",
  });
});

test("changed project link recreates the row", () => {
  const input = baseInput();
  input.projectLinks = [{ title: "Portfolio", url: "https://example.com/b" }];
  const diff = diffProfileRows(baseExisting(), input);
  assert.deepEqual(diff.profileLinks?.deleteMany, { id: { in: ["plink-1"] } });
  assert.equal(diff.profileLinks?.create?.length, 1);
});
