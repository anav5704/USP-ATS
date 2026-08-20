import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toProfileModel,
  toProfileInput,
  type ProfileResult,
} from "@/lib/profile/to-profile-input";

const VALID_STORED = "123e4567-e89b-12d3-a456-426614174000.pdf";

function baseResult(): ProfileResult {
  return {
    phone: "+679 323 1000",
    bio: "Student at USP",
    skills: ["Python", "Communication"],
    campuses: ["Laucala"],
    degrees: [
      {
        name: "Bachelor of Science (Computer Science)",
        gpa: { toString: () => "3.80" },
        documentType: "TRANSCRIPT",
        fileName: "transcript.pdf",
        stored: VALID_STORED,
        type: "application/pdf",
        size: 2048,
        uploadedAt: new Date("2026-06-15"),
      },
    ],
    certificates: [
      {
        label: "Peer Tutor",
        organization: "USP",
        url: "https://example.com",
        uploadedAt: new Date("2026-01-15"),
        name: "certificate.pdf",
        stored: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
        type: "application/pdf",
        size: 1024,
      },
    ],
    socialLinks: [{ platform: "LinkedIn", url: "https://linkedin.com/in/johndoe" }],
    profileLinks: [{ title: "Portfolio", url: "https://johndoe.com" }],
  };
}

describe("toProfileModel", () => {
  it("maps basic fields correctly", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    assert.equal(model.phone, "+679 323 1000");
    assert.equal(model.bio, "Student at USP");
    assert.deepEqual(model.skills, ["Python", "Communication"]);
    assert.deepEqual(model.campuses, ["Laucala"]);
  });

  it("maps degrees with document type conversion", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    assert.equal(model.degrees.length, 1);
    assert.equal(model.degrees[0].name, "Bachelor of Science (Computer Science)");
    assert.equal(model.degrees[0].gpa, "3.80");
    assert.equal(model.degrees[0].documentType, "transcript");
    assert.equal(model.degrees[0].document.name, "transcript.pdf");
    assert.equal(model.degrees[0].document.stored, VALID_STORED);
  });

  it("converts DEGREE document type to 'degree'", () => {
    const result = baseResult();
    result.degrees[0].documentType = "DEGREE";
    const model = toProfileModel(result);
    assert.equal(model.degrees[0].documentType, "degree");
  });

  it("maps certificates with date formatting", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    assert.equal(model.certificates.length, 1);
    assert.equal(model.certificates[0].label, "Peer Tutor");
    assert.equal(model.certificates[0].organization, "USP");
    assert.equal(model.certificates[0].url, "https://example.com");
    assert.equal(model.certificates[0].uploadedAt, "2026-01-15");
  });

  it("handles null organization and url", () => {
    const result = baseResult();
    result.certificates[0].organization = null;
    result.certificates[0].url = null;
    const model = toProfileModel(result);
    assert.equal(model.certificates[0].organization, "");
    assert.equal(model.certificates[0].url, "");
  });

  it("maps social links and profile links", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    assert.deepEqual(model.socialLinks, [
      { platform: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
    ]);
    assert.deepEqual(model.profileLinks, [
      { title: "Portfolio", url: "https://johndoe.com" },
    ]);
  });
});

describe("toProfileInput", () => {
  it("maps model to input format", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    const input = toProfileInput(model);
    assert.equal(input.phone, "+679 323 1000");
    assert.equal(input.bio, "Student at USP");
    assert.deepEqual(input.campuses, ["Laucala"]);
    assert.deepEqual(input.skills, ["Python", "Communication"]);
  });

  it("maps degrees correctly", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    const input = toProfileInput(model);
    assert.equal(input.degrees.length, 1);
    assert.equal(input.degrees[0].name, "Bachelor of Science (Computer Science)");
    assert.equal(input.degrees[0].gpa, 3.8);
    assert.equal(input.degrees[0].documentType, "transcript");
  });

  it("maps certificates correctly", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    const input = toProfileInput(model);
    assert.equal(input.certificates.length, 1);
    assert.equal(input.certificates[0].label, "Peer Tutor");
    assert.equal(input.certificates[0].organization, "USP");
  });

  it("maps social links and project links", () => {
    const result = baseResult();
    const model = toProfileModel(result);
    const input = toProfileInput(model);
    assert.deepEqual(input.socialLinks, [
      { platform: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
    ]);
    assert.deepEqual(input.projectLinks, [
      { title: "Portfolio", url: "https://johndoe.com" },
    ]);
  });

  it("handles null fields gracefully", () => {
    const result = baseResult();
    result.phone = null;
    result.bio = null;
    result.skills = null;
    const model = toProfileModel(result);
    const input = toProfileInput(model);
    assert.equal(input.phone, "");
    assert.equal(input.bio, "");
    assert.deepEqual(input.skills, []);
  });
});
