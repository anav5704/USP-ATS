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
  skills: string[];
  campuses: string[];
};

export type BuildCreateProfileDataResult = ScalarProfileData & {
  degrees: { create: Prisma.DegreeCreateWithoutProfileInput[] };
  certificates: { create: Prisma.CertificateCreateWithoutProfileInput[] };
  socialLinks: { create: Prisma.SocialLinkCreateWithoutProfileInput[] };
  profileLinks: { create: Prisma.ProfileLinkCreateWithoutProfileInput[] };
};

export type BuildUpdateProfileDataResult = ScalarProfileData & {
  degrees: {
    deleteMany: Prisma.DegreeScalarWhereInput;
    create: Prisma.DegreeCreateWithoutProfileInput[];
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
};

export function buildProfileData(
  input: ProfileInput,
  options: { replace: false }
): BuildCreateProfileDataResult;
export function buildProfileData(
  input: ProfileInput,
  options: { replace: true }
): BuildUpdateProfileDataResult;
export function buildProfileData(
  input: ProfileInput,
  options: { replace: boolean }
): BuildCreateProfileDataResult | BuildUpdateProfileDataResult;
export function buildProfileData(
  input: ProfileInput,
  options: { replace: boolean }
): BuildCreateProfileDataResult | BuildUpdateProfileDataResult {
  const { replace } = options;

  const degrees = input.degrees.map((degree) => ({
    name: degree.name,
    gpa: degree.gpa,
    documentType:
      (degree.documentType === "degree"
        ? "DEGREE"
        : "TRANSCRIPT") as "TRANSCRIPT" | "DEGREE",
    fileName: degree.document!.name,
    stored: degree.document!.stored,
    type: degree.document!.type,
    size: degree.document!.size,
  }));
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

  const scalars: ScalarProfileData = {
    phone: input.phone.trim() === "" ? null : input.phone.trim(),
    bio: input.bio.trim() === "" ? null : input.bio.trim(),
    skills: input.skills,
    campuses: input.campuses,
  };

  if (!replace) {
    return {
      ...scalars,
      degrees: { create: degrees },
      certificates: { create: certificates },
      socialLinks: { create: socialLinks },
      profileLinks: { create: profileLinks },
    };
  }

  return {
    ...scalars,
    degrees: { deleteMany: {}, create: degrees },
    certificates: { deleteMany: {}, create: certificates },
    socialLinks: { deleteMany: {}, create: socialLinks },
    profileLinks: { deleteMany: {}, create: profileLinks },
  };
}

export function referencedStoredFiles(input: ProfileInput) {
  const stored = new Set<string>();
  for (const degree of input.degrees) {
    if (degree.document) stored.add(degree.document.stored);
  }
  for (const entry of input.certificates) {
    if (entry.file) stored.add(entry.file.stored);
  }
  return stored;
}