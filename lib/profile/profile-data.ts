import { ZodError } from "zod";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import type { Prisma } from "@/generated/prisma/client";

function toNullable(value: string) {
  return value.trim() === "" ? null : value.trim();
}

export function firstProfileError(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid profile data";
}

type ScalarProfileData = {
  phone: string | null;
  bio: string | null;
  degreeStatus: "IN_PROGRESS" | "COMPLETED";
  gpa: number;
  skills: string[];
  degrees: string[];
  campuses: string[];
};

export type BuildCreateProfileDataResult = ScalarProfileData & {
  transcript?:
    | { create: Prisma.TranscriptCreateWithoutProfileInput }
    | { create: Prisma.TranscriptUncheckedCreateWithoutProfileInput };
  certificates: { create: Prisma.CertificateCreateWithoutProfileInput[] };
  socialLinks: { create: Prisma.SocialLinkCreateWithoutProfileInput[] };
  profileLinks: { create: Prisma.ProfileLinkCreateWithoutProfileInput[] };
};

export type BuildUpdateProfileDataResult = ScalarProfileData & {
  transcript?:
    | { create: Prisma.TranscriptCreateWithoutProfileInput }
    | { update: Prisma.TranscriptUpdateWithoutProfileInput }
    | { delete: true };
  certificates: {
    deleteMany: Prisma.CertificateScalarWhereInput;
    create: Prisma.CertificateCreateWithoutProfileInput[];
  };
  socialLinks: {
    deleteMany: Prisma.SocialLinkScalarWhereInput;
    create: Prisma.SocialLinkCreateWithoutProfileInput[];
  };
  profileLinks: {
    deleteMany: Prisma.ProfileLinkScalarWhereInput;
    create: Prisma.ProfileLinkCreateWithoutProfileInput[];
  };
};

export function buildProfileData(
  input: ProfileInput,
  options: { replace: false }
): BuildCreateProfileDataResult;
export function buildProfileData(
  input: ProfileInput,
  options: { replace: true; transcriptExists: boolean }
): BuildUpdateProfileDataResult;
export function buildProfileData(
  input: ProfileInput,
  options: { replace: boolean; transcriptExists?: boolean }
): BuildCreateProfileDataResult | BuildUpdateProfileDataResult;
export function buildProfileData(
  input: ProfileInput,
  options: { replace: boolean; transcriptExists?: boolean }
): BuildCreateProfileDataResult | BuildUpdateProfileDataResult {
  const { replace, transcriptExists = false } = options;

  const certificates = input.certificates.map((entry) => ({
    label: entry.label,
    organization: toNullable(entry.organization),
    url: toNullable(entry.url),
    uploadedAt: new Date(`${entry.uploadedAt}T00:00:00`),
    name: entry.file!.name,
    stored: entry.file!.stored,
    type: entry.file!.type,
    size: entry.file!.size,
  }));
  const socialLinks = input.socialLinks.map((link) => ({
    platform: link.platform,
    url: link.url,
  }));
  const profileLinks = input.projectLinks.map((link) => ({
    title: link.title,
    url: link.url,
  }));
  const transcriptData = input.transcript
    ? {
        name: input.transcript.name,
        stored: input.transcript.stored,
        type: input.transcript.type,
        size: input.transcript.size,
      }
    : null;

  const scalars: ScalarProfileData = {
    phone: input.phone.trim() === "" ? null : input.phone.trim(),
    bio: input.bio.trim() === "" ? null : input.bio.trim(),
    degreeStatus:
      (input.degreeStatus === "completed"
        ? "COMPLETED"
        : "IN_PROGRESS") as "IN_PROGRESS" | "COMPLETED",
    gpa: input.gpa,
    skills: input.skills,
    degrees: input.degrees,
    campuses: input.campuses,
  };

  if (!replace) {
    return {
      ...scalars,
      ...(transcriptData ? { transcript: { create: transcriptData } } : {}),
      certificates: { create: certificates },
      socialLinks: { create: socialLinks },
      profileLinks: { create: profileLinks },
    };
  }

  const transcript: BuildUpdateProfileDataResult["transcript"] = transcriptData
    ? transcriptExists
      ? { update: transcriptData }
      : { create: transcriptData }
    : transcriptExists
      ? { delete: true }
      : undefined;

  return {
    ...scalars,
    ...(transcript ? { transcript } : {}),
    certificates: { deleteMany: {}, create: certificates },
    socialLinks: { deleteMany: {}, create: socialLinks },
    profileLinks: { deleteMany: {}, create: profileLinks },
  };
}

export function referencedStoredFiles(input: ProfileInput) {
  const stored = new Set<string>();
  if (input.transcript) stored.add(input.transcript.stored);
  for (const entry of input.certificates) {
    if (entry.file) stored.add(entry.file.stored);
  }
  return stored;
}