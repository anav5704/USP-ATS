import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import {
  firstProfileError,
  referencedStoredFiles,
} from "@/lib/profile/profile-data";
import type { ProfileInput } from "@/lib/profile/profile-schema";

const VALID_STORED = "123e4567-e89b-12d3-a456-426614174000.pdf";

function baseInput(): ProfileInput {
  return {
    phone: "",
    bio: "",
    campuses: ["Laucala"],
    skills: ["Python"],
    degrees: [
      {
        name: "Bachelor of Science (Computer Science)",
        gpa: 3.8,
        documentType: "transcript",
        document: {
          name: "transcript.pdf",
          stored: VALID_STORED,
          type: "application/pdf",
          size: 2048,
        },
      },
    ],
    certificates: [],
    socialLinks: [],
    projectLinks: [],
  };
}

describe("firstProfileError", () => {
  it("returns the first error message from a ZodError", () => {
    const error = new ZodError([
      {
        code: "custom",
        path: ["phone"],
        message: "Phone is invalid",
      },
      {
        code: "custom",
        path: ["bio"],
        message: "Bio is too long",
      },
    ]);
    assert.equal(firstProfileError(error), "Phone is invalid");
  });

  it("returns a default message for empty errors", () => {
    const error = new ZodError([]);
    assert.equal(firstProfileError(error), "Invalid profile data");
  });
});

describe("referencedStoredFiles", () => {
  it("collects stored file names from degrees", () => {
    const input = baseInput();
    const result = referencedStoredFiles(input);
    assert.deepEqual(result, new Set([VALID_STORED]));
  });

  it("collects stored file names from certificates", () => {
    const input = baseInput();
    input.certificates = [
      {
        label: "Peer Tutor",
        organization: "USP",
        url: "",
        uploadedAt: "2026-01-15",
        file: {
          name: "certificate.pdf",
          stored: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
          type: "application/pdf",
          size: 1024,
        },
      },
    ];
    const result = referencedStoredFiles(input);
    assert.deepEqual(
      result,
      new Set([VALID_STORED, "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf"])
    );
  });

  it("collects from both degrees and certificates", () => {
    const input = baseInput();
    input.degrees = [
      {
        name: "Bachelor of Science",
        gpa: 3.5,
        documentType: "degree",
        document: {
          name: "degree.pdf",
          stored: "b2c3d4e5-f6a7-8901-bcde-f12345678901.pdf",
          type: "application/pdf",
          size: 2048,
        },
      },
    ];
    input.certificates = [
      {
        label: "Award",
        organization: "USP",
        url: "",
        uploadedAt: "2026-01-15",
        file: {
          name: "award.pdf",
          stored: "c3d4e5f6-a7b8-9012-cdef-123456789012.pdf",
          type: "application/pdf",
          size: 1024,
        },
      },
    ];
    const result = referencedStoredFiles(input);
    assert.equal(result.size, 2);
    assert.equal(result.has("b2c3d4e5-f6a7-8901-bcde-f12345678901.pdf"), true);
    assert.equal(result.has("c3d4e5f6-a7b8-9012-cdef-123456789012.pdf"), true);
  });

  it("ignores null documents", () => {
    const input = baseInput();
    input.degrees[0].document = null;
    const result = referencedStoredFiles(input);
    assert.deepEqual(result, new Set());
  });
});
