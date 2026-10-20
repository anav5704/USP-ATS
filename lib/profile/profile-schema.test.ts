import { describe, expect, test } from "vitest";

import { applySelectionLimit } from "@/components/ui/selection-limit";

import {
  MAX_UPLOAD_COUNT,
  MAX_UPLOAD_SIZE,
  isSafeStoredName,
  validateUploadFile,
} from "@/lib/profile/upload";
import {
  certificateInputSchema,
  degreeInputSchema,
  profileInputSchema,
  projectLinkInputSchema,
  socialLinkInputSchema,
} from "@/lib/profile/profile-schema";

const STORED = "3f2504e0-4f89-41d3-9a0c-0305e82c3301.pdf";

const degree = (over: Record<string, unknown> = {}) => ({
  name: "Bachelor of Science",
  gpa: 3.9,
  documentType: "transcript",
  document: { name: "transcript.pdf", stored: STORED, type: "application/pdf", size: 1024 },
  ...over,
});

const socialLink = (over: Record<string, unknown> = {}) => ({
  platform: "GitHub",
  url: "https://github.com/example",
  ...over,
});

const projectLink = (over: Record<string, unknown> = {}) => ({
  title: "Portfolio",
  url: "https://example.com",
  ...over,
});

const certificate = (over: Record<string, unknown> = {}) => ({
  label: "AWS",
  organization: "Amazon",
  url: "",
  uploadedAt: "2026-10-11",
  file: { name: "cert.pdf", stored: STORED, type: "application/pdf", size: 10 },
  ...over,
});

const baseProfile = {
  phone: "",
  bio: "",
  campuses: ["Laucala Campus"],
  skills: ["Python"],
  degrees: [degree()],
  certificates: [],
  socialLinks: [],
  projectLinks: [],
};

type ParseResult = { success: boolean; error?: { issues: { message: string }[] } };

const firstIssue = (result: ParseResult) =>
  result.success ? "" : (result.error?.issues[0]?.message ?? "");

const at = (n: number) => "x".repeat(n);

const repeat = (make: () => Record<string, unknown>, count: number) =>
  Array.from({ length: count }, make);

describe("Profile Management", () => {
  test("TC-09", () => {
    expect(firstIssue(profileInputSchema.safeParse({ ...baseProfile, campuses: [] }))).toBe(
      "Select your campus or centre"
    );
    expect(firstIssue(profileInputSchema.safeParse({ ...baseProfile, skills: [] }))).toBe(
      "Select at least one skill"
    );
    expect(firstIssue(profileInputSchema.safeParse({ ...baseProfile, degrees: [] }))).toBe(
      "Add at least one degree"
    );

    const atMax: [string, unknown[], unknown, string][] = [
      ["campuses", Array.from({ length: 20 }, (_, i) => `Campus ${i}`), "Campus 20", "Too many campuses"],
      ["skills", Array.from({ length: 10 }, (_, i) => `Skill ${i}`), "Skill 10", "You can select up to 10 skills"],
      ["degrees", Array.from({ length: 20 }, () => degree()), degree(), "Too many degrees"],
    ];

    for (const [key, atLimit, extra, message] of atMax) {
      expect(profileInputSchema.safeParse({ ...baseProfile, [key]: atLimit }).success, key).toBe(true);
      expect(
        firstIssue(profileInputSchema.safeParse({ ...baseProfile, [key]: [...atLimit, extra] })),
        key
      ).toBe(message);
    }

    expect(firstIssue(profileInputSchema.safeParse({ ...baseProfile, campuses: ["   "] }))).toBe(
      "Campus name is required"
    );
    expect(firstIssue(profileInputSchema.safeParse({ ...baseProfile, skills: [""] }))).toBe(
      "Skill name is required"
    );
    expect(firstIssue(degreeInputSchema.safeParse(degree({ name: "   " })))).toBe("Degree name is required");
  });

  test("TC-10", () => {
    for (const gpa of [0, 4.5]) {
      expect(degreeInputSchema.safeParse(degree({ gpa })).success, String(gpa)).toBe(true);
    }
    for (const gpa of [4.51, -0.01]) {
      expect(firstIssue(degreeInputSchema.safeParse(degree({ gpa }))), String(gpa)).toBe(
        "GPA must be between 0.00 and 4.50"
      );
    }
    expect(firstIssue(degreeInputSchema.safeParse(degree({ gpa: 3.456 })))).toBe(
      "GPA can have at most 2 decimal places"
    );
    expect(degreeInputSchema.safeParse(degree({ gpa: 3.46 })).success).toBe(true);
    for (const gpa of ["abc", "", Number.NaN]) {
      expect(firstIssue(degreeInputSchema.safeParse(degree({ gpa }))), String(gpa)).toBe("Enter your GPA");
    }
  });

  test("TC-11", () => {
    expect(profileInputSchema.safeParse({ ...baseProfile, phone: "" }).success).toBe(true);

    const validPhones = [
      "1234567",
      "12345678901",
      "+1234567",
      "+12345678901",
      "6791234",
      "6791234567",
      "+6791234",
      "+6791234567",
    ];
    for (const phone of validPhones) {
      expect(profileInputSchema.safeParse({ ...baseProfile, phone }).success, phone).toBe(true);
    }

    const invalidPhones = [
      "123456",
      "123456789012",
      "+123456",
      "+123456789012",
      "++6791234567",
      "67+9123456",
      "679+123456",
      "+679+123456",
      "abc1234567",
      "679abc1234",
      "679 123 456",
      "679-123-456",
      "(679)123456",
      "679.123456",
      "679,123456",
      "679/123456",
    ];
    for (const phone of invalidPhones) {
      expect(profileInputSchema.safeParse({ ...baseProfile, phone }).success, phone).toBe(false);
    }
    expect(firstIssue(profileInputSchema.safeParse({ ...baseProfile, phone: "abc12345" }))).toBe(
      "Phone number must contain 7 to 11 digits and may start with +."
    );

    expect(profileInputSchema.safeParse({ ...baseProfile, bio: "" }).success).toBe(true);
    expect(profileInputSchema.safeParse({ ...baseProfile, bio: at(500) }).success).toBe(true);
    expect(firstIssue(profileInputSchema.safeParse({ ...baseProfile, bio: at(501) }))).toBe("Bio is too long");
  });

  test("TC-12", () => {
    const base = "https://example.com/";
    const atMax = base + "p".repeat(2000 - base.length);
    const overMax = base + "p".repeat(2001 - base.length);

    for (const [schema, make] of [
      [socialLinkInputSchema, socialLink],
      [projectLinkInputSchema, projectLink],
    ] as const) {
      expect(schema.safeParse(make({ url: "" })).success).toBe(false);
      expect(firstIssue(schema.safeParse(make({ url: "not-a-url" })))).toBe("Enter a valid URL");
      expect(schema.safeParse(make({ url: atMax })).success).toBe(true);
      expect(firstIssue(schema.safeParse(make({ url: overMax })))).toBe("Link is too long");
    }

    expect(certificateInputSchema.safeParse(certificate({ url: "" })).success).toBe(true);
    expect(certificateInputSchema.safeParse(certificate({ url: "not-a-url" })).success).toBe(false);
    expect(certificateInputSchema.safeParse(certificate({ url: atMax })).success).toBe(true);
  });

  test("TC-13", () => {
    expect(firstIssue(degreeInputSchema.safeParse(degree({ name: "" })))).toBe("Degree name is required");
    expect(firstIssue(degreeInputSchema.safeParse(degree({ name: "   " })))).toBe("Degree name is required");
    expect(degreeInputSchema.safeParse(degree({ name: at(1) })).success).toBe(true);
    expect(degreeInputSchema.safeParse(degree({ name: at(200) })).success).toBe(true);
    expect(firstIssue(degreeInputSchema.safeParse(degree({ name: at(201) })))).toBe("Degree name is too long");

    expect(firstIssue(certificateInputSchema.safeParse(certificate({ label: "" })))).toBe(
      "Certificate name is required"
    );
    expect(firstIssue(certificateInputSchema.safeParse(certificate({ organization: "" })))).toBe(
      "Organization is required"
    );
    expect(firstIssue(certificateInputSchema.safeParse(certificate({ label: at(201) })))).toBe(
      "Certificate name is too long"
    );
    expect(firstIssue(certificateInputSchema.safeParse(certificate({ organization: at(201) })))).toBe(
      "Organization name is too long"
    );

    expect(firstIssue(projectLinkInputSchema.safeParse(projectLink({ title: "" })))).toBe("Title is required");
    expect(firstIssue(projectLinkInputSchema.safeParse(projectLink({ title: at(201) })))).toBe("Title is too long");

    expect(socialLinkInputSchema.safeParse(socialLink({ platform: at(50) })).success).toBe(true);
    expect(firstIssue(socialLinkInputSchema.safeParse(socialLink({ platform: at(51) })))).toBe(
      "Platform name is too long"
    );
    expect(firstIssue(socialLinkInputSchema.safeParse(socialLink({ platform: "   " })))).toBe(
      "Platform is required"
    );
  });

  test("TC-14", () => {
    const cases: [string, () => Record<string, unknown>][] = [
      ["certificates", () => certificate()],
      ["socialLinks", () => socialLink()],
      ["projectLinks", () => projectLink()],
    ];

    for (const [key, make] of cases) {
      expect(profileInputSchema.safeParse({ ...baseProfile, [key]: [] }).success, key).toBe(true);
      expect(profileInputSchema.safeParse({ ...baseProfile, [key]: repeat(make, 20) }).success, key).toBe(true);
      expect(profileInputSchema.safeParse({ ...baseProfile, [key]: repeat(make, 21) }).success, key).toBe(false);
    }
  });

  test("TC-15", () => {
    for (const type of ["application/pdf", "image/png", "image/jpeg", "image/webp"]) {
      expect(validateUploadFile({ name: "f", type, size: 10 }), type).toEqual({ ok: true });
    }
    for (const type of ["application/msword", "application/x-msdownload", "text/plain"]) {
      expect(validateUploadFile({ name: "f", type, size: 10 }).ok, type).toBe(false);
    }

    expect(MAX_UPLOAD_SIZE).toBe(1048576);
    expect(validateUploadFile({ name: "f", type: "application/pdf", size: MAX_UPLOAD_SIZE }).ok).toBe(true);
    expect(validateUploadFile({ name: "f", type: "application/pdf", size: MAX_UPLOAD_SIZE + 1 })).toEqual({
      ok: false,
      error: "File must be 1 MB or smaller",
    });

    expect(validateUploadFile({ name: "", type: "application/pdf", size: 1 }).ok).toBe(false);
    expect(validateUploadFile({ name: "   ", type: "application/pdf", size: 1 }).ok).toBe(false);
    expect(validateUploadFile({ name: at(255), type: "application/pdf", size: 1 }).ok).toBe(true);
    expect(validateUploadFile({ name: at(256), type: "application/pdf", size: 1 }).ok).toBe(false);

    expect(MAX_UPLOAD_COUNT).toBe(20);

    for (const stored of ["../../etc/passwd", "abc.pdf", "3f2504e0-4f89-41d3-9a0c.pdf", "..%2f..%2fetc"]) {
      expect(isSafeStoredName(stored), stored).toBe(false);
    }
    expect(isSafeStoredName(STORED)).toBe(true);
    expect(
      firstIssue(
        profileInputSchema.safeParse({
          ...baseProfile,
          degrees: [degree({ document: { name: "a.pdf", stored: "../x", type: "application/pdf", size: 10 } })],
        })
      )
    ).toBe("Invalid stored file name");
  });

  test("TC-16", () => {
    const ten = Array.from({ length: 10 }, (_, i) => `Skill ${i}`);

    const withinLimit = applySelectionLimit(ten, 10);
    expect(withinLimit.value).toHaveLength(10);
    expect(withinLimit.limitReached).toBe(false);

    const overflow = applySelectionLimit([...ten, "Skill 10", "Skill 11"], 10);
    expect(overflow.limitReached).toBe(true);
    expect(overflow.value).toHaveLength(10);
  });
});
