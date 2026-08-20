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
  title: string | null;
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
  education: { create: Prisma.EducationCreateWithoutProfileInput[] };
  certificates: { create: Prisma.CertificateCreateWithoutProfileInput[] };
  socialLinks: { create: Prisma.SocialLinkCreateWithoutProfileInput[] };
  profileLinks: { create: Prisma.ProfileLinkCreateWithoutProfileInput[] };
  projects: { create: Prisma.ProjectCreateWithoutProfileInput[] };
};

export type BuildUpdateProfileDataResult = ScalarProfileData & {
  transcript?:
    | { create: Prisma.TranscriptCreateWithoutProfileInput }
    | { update: Prisma.TranscriptUpdateWithoutProfileInput }
    | { delete: true };
  education: {
    deleteMany: Prisma.EducationScalarWhereInput;
    create: Prisma.EducationCreateWithoutProfileInput[];
  };
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
  projects: {
    deleteMany: Prisma.ProjectScalarWhereInput;
    create: Prisma.ProjectCreateWithoutProfileInput[];
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

  const education = input.education.map((entry) => ({
    institution: entry.institution,
    program: toNullable(entry.program),
  }));
  const projects = input.projects.map((project) => ({
    name: project.name,
    description: toNullable(project.description),
    link: toNullable(project.link),
  }));
  const certificates = input.certificates.map((entry) => ({
    label: entry.label,
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
    title: input.title.trim() === "" ? null : input.title.trim(),
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
      education: { create: education },
      certificates: { create: certificates },
      socialLinks: { create: socialLinks },
      profileLinks: { create: profileLinks },
      projects: { create: projects },
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
    education: { deleteMany: {}, create: education },
    certificates: { deleteMany: {}, create: certificates },
    socialLinks: { deleteMany: {}, create: socialLinks },
    profileLinks: { deleteMany: {}, create: profileLinks },
    projects: { deleteMany: {}, create: projects },
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