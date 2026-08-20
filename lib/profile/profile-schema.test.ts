import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  certificateInputSchema,
  degreeInputSchema,
  profileInputSchema,
  projectLinkInputSchema,
  socialLinkInputSchema,
} from "@/lib/profile/profile-schema";

const VALID_STORED = "123e4567-e89b-12d3-a456-426614174000.pdf";

function baseInput() {
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
        document: transcriptFile(),
      },
    ],
    certificates: [],
    socialLinks: [],
    projectLinks: [],
  };
}

function transcriptFile(overrides: Record<string, unknown> = {}) {
  return {
    name: "transcript.pdf",
    stored: VALID_STORED,
    type: "application/pdf",
    size: 2048,
    ...overrides,
  };
}

function degree(overrides: Record<string, unknown> = {}) {
  return {
    name: "Bachelor of Science (Computer Science)",
    gpa: 3.8,
    documentType: "transcript",
    document: transcriptFile(),
    ...overrides,
  };
}

describe("degreeInputSchema GPA validation", () => {
  it("accepts boundary values 0.00 and 4.50", () => {
    assert.equal(degreeInputSchema.safeParse(degree({ gpa: 0 })).success, true);
    assert.equal(degreeInputSchema.safeParse(degree({ gpa: 4.5 })).success, true);
  });

  it("rejects values below 0 or above 4.5", () => {
    assert.equal(degreeInputSchema.safeParse(degree({ gpa: -0.01 })).success, false);
    assert.equal(degreeInputSchema.safeParse(degree({ gpa: 4.51 })).success, false);
  });

  it("rejects values with more than 2 decimal places", () => {
    assert.equal(degreeInputSchema.safeParse(degree({ gpa: 3.801 })).success, false);
  });

  it("accepts values with up to 2 decimal places", () => {
    assert.equal(degreeInputSchema.safeParse(degree({ gpa: 3.8 })).success, true);
    assert.equal(degreeInputSchema.safeParse(degree({ gpa: 4.49 })).success, true);
  });
});

describe("degree document requirement", () => {
  it("requires a document for each degree", () => {
    const result = profileInputSchema.safeParse({
      ...baseInput(),
      degrees: [degree({ document: null })],
    });
    assert.equal(result.success, false);
    assert.equal(
      result.success === false ? result.error.issues[0]?.path[0] : null,
      "degrees"
    );
  });

  it("accepts a degree with a transcript", () => {
    const result = profileInputSchema.safeParse({
      ...baseInput(),
      degrees: [degree({ documentType: "transcript" })],
    });
    assert.equal(result.success, true);
  });

  it("accepts a degree with a degree document", () => {
    const result = profileInputSchema.safeParse({
      ...baseInput(),
      degrees: [degree({ documentType: "degree" })],
    });
    assert.equal(result.success, true);
  });

  it("rejects unknown document type values", () => {
    const result = profileInputSchema.safeParse({
      ...baseInput(),
      degrees: [degree({ documentType: "graduated" })],
    });
    assert.equal(result.success, false);
  });
});

describe("profile schema link URL validation", () => {
  it("accepts valid social link URLs", () => {
    assert.equal(
      socialLinkInputSchema.safeParse({
        platform: "LinkedIn",
        url: "https://www.linkedin.com/in/someone",
      }).success,
      true
    );
  });

  it("rejects social links with invalid URLs", () => {
    const result = socialLinkInputSchema.safeParse({
      platform: "LinkedIn",
      url: "not a url",
    });
    assert.equal(result.success, false);
  });

  it("rejects social links without a platform", () => {
    const result = socialLinkInputSchema.safeParse({
      platform: "",
      url: "https://github.com/someone",
    });
    assert.equal(result.success, false);
  });

  it("accepts valid project links", () => {
    assert.equal(
      projectLinkInputSchema.safeParse({
        title: "Weather app",
        url: "https://github.com/someone/weather",
      }).success,
      true
    );
  });

  it("rejects project links with invalid URLs or missing titles", () => {
    assert.equal(
      projectLinkInputSchema.safeParse({
        title: "Weather app",
        url: "weather",
      }).success,
      false
    );
    assert.equal(
      projectLinkInputSchema.safeParse({
        title: "",
        url: "https://github.com/someone/weather",
      }).success,
      false
    );
  });
});

describe("certificate input validation", () => {
  it("accepts a complete certificate", () => {
    assert.equal(
      certificateInputSchema.safeParse({
        label: "Peer Tutor",
        organization: "USP",
        url: "",
        uploadedAt: "2026-01-15",
        file: transcriptFile({ name: "peer-tutor.pdf" }),
      }).success,
      true
    );
  });

  it("rejects a certificate without a file", () => {
    const result = profileInputSchema.safeParse({
      ...baseInput(),
      certificates: [
        {
          label: "Peer Tutor",
          organization: "USP",
          url: "",
          uploadedAt: "2026-01-15",
          file: null,
        },
      ],
    });
    assert.equal(result.success, false);
  });

  it("rejects a certificate without a label or organization, or with an invalid date or url", () => {
    assert.equal(
      certificateInputSchema.safeParse({
        label: "",
        organization: "USP",
        uploadedAt: "2026-01-15",
        file: transcriptFile(),
      }).success,
      false
    );
    assert.equal(
      certificateInputSchema.safeParse({
        label: "Peer Tutor",
        organization: "",
        uploadedAt: "2026-01-15",
        file: transcriptFile(),
      }).success,
      false
    );
    assert.equal(
      certificateInputSchema.safeParse({
        label: "Peer Tutor",
        organization: "USP",
        uploadedAt: "not-a-date",
        file: transcriptFile(),
      }).success,
      false
    );
    assert.equal(
      certificateInputSchema.safeParse({
        label: "Peer Tutor",
        organization: "USP",
        url: "not-a-url",
        uploadedAt: "2026-01-15",
        file: transcriptFile(),
      }).success,
      false
    );
  });
});

describe("phone validation", () => {
  it("allows an empty phone number", () => {
    assert.equal(
      profileInputSchema.safeParse({ ...baseInput(), phone: "" }).success,
      true
    );
  });

  it("accepts internationally formatted numbers", () => {
    assert.equal(
      profileInputSchema.safeParse({
        ...baseInput(),
        phone: "+679 323 1000",
      }).success,
      true
    );
    assert.equal(
      profileInputSchema.safeParse({ ...baseInput(), phone: "0123456789" }).success,
      true
    );
  });

  it("rejects invalid phone numbers", () => {
    assert.equal(
      profileInputSchema.safeParse({ ...baseInput(), phone: "hello!" }).success,
      false
    );
    assert.equal(
      profileInputSchema.safeParse({ ...baseInput(), phone: "1" }).success,
      false
    );
  });
});