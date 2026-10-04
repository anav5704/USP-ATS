import type { Prisma } from "@/generated/prisma/client";
import type { ProfileInput } from "@/lib/profile/profile-schema";

export type ExistingDegreeRow = {
  id: string;
  name: string;
  gpa: number | string | { toString(): string };
  documentType: string;
  fileName: string;
  stored: string;
  type: string;
  size: number;
};

export type ExistingCertificateRow = {
  id: string;
  label: string;
  organization: string | null;
  url: string | null;
  uploadedAt: Date;
  name: string;
  stored: string;
  type: string;
  size: number;
};

export type ExistingLinkRow = {
  id: string;
  platform: string;
  url: string;
};

export type ExistingProjectLinkRow = {
  id: string;
  title: string;
  url: string;
};

export type ExistingProfileRows = {
  degrees: ExistingDegreeRow[];
  certificates: ExistingCertificateRow[];
  socialLinks: ExistingLinkRow[];
  profileLinks: ExistingProjectLinkRow[];
};

export type ProfileRelationDiff = {
  degrees?: {
    create?: Prisma.DegreeCreateWithoutProfileInput[];
    update?: {
      where: { id: string };
      data: Prisma.DegreeUpdateWithoutProfileInput;
    }[];
    deleteMany?: Prisma.DegreeScalarWhereInput;
  };
  certificates?: {
    create?: Prisma.CertificateCreateWithoutProfileInput[];
    update?: {
      where: { id: string };
      data: Prisma.CertificateUpdateWithoutProfileInput;
    }[];
    deleteMany?: Prisma.CertificateScalarWhereInput;
  };
  socialLinks?: {
    create?: Prisma.SocialLinkCreateWithoutProfileInput[];
    update?: {
      where: { id: string };
      data: Prisma.SocialLinkUpdateWithoutProfileInput;
    }[];
    deleteMany?: Prisma.SocialLinkScalarWhereInput;
  };
  profileLinks?: {
    create?: Prisma.ProfileLinkCreateWithoutProfileInput[];
    deleteMany?: Prisma.ProfileLinkScalarWhereInput;
  };
};

export type ProfileDiff = ProfileRelationDiff & {
  removedStored: string[];
};

function toDocumentType(value: string): "TRANSCRIPT" | "DEGREE" {
  return value === "degree" ? "DEGREE" : "TRANSCRIPT";
}

function trimOrNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

export function diffProfileRows(
  existing: ExistingProfileRows,
  input: ProfileInput
): ProfileDiff {
  const removedStored: string[] = [];
  const diff: ProfileRelationDiff = {};

  const degreeCreates: Prisma.DegreeCreateWithoutProfileInput[] = [];
  const degreeUpdates: NonNullable<
    ProfileRelationDiff["degrees"]
  >["update"] = [];
  const seenDegreeStored = new Set<string>();
  for (const degree of input.degrees) {
    const stored = degree.document!.stored;
    if (seenDegreeStored.has(stored)) {
      degreeCreates.push({
        name: degree.name,
        gpa: degree.gpa,
        documentType: toDocumentType(degree.documentType),
        fileName: degree.document!.name,
        stored,
        type: degree.document!.type,
        size: degree.document!.size,
      });
      continue;
    }
    seenDegreeStored.add(stored);
    const current = existing.degrees.find((row) => row.stored === stored);
    if (!current) {
      degreeCreates.push({
        name: degree.name,
        gpa: degree.gpa,
        documentType: toDocumentType(degree.documentType),
        fileName: degree.document!.name,
        stored,
        type: degree.document!.type,
        size: degree.document!.size,
      });
      continue;
    }
    const data: Prisma.DegreeUpdateWithoutProfileInput = {};
    if (current.name !== degree.name) data.name = degree.name;
    if (Number(current.gpa) !== degree.gpa) data.gpa = degree.gpa;
    if (current.documentType !== toDocumentType(degree.documentType)) {
      data.documentType = toDocumentType(degree.documentType);
    }
    if (current.fileName !== degree.document!.name) {
      data.fileName = degree.document!.name;
    }
    if (current.type !== degree.document!.type) data.type = degree.document!.type;
    if (current.size !== degree.document!.size) data.size = degree.document!.size;
    if (Object.keys(data).length > 0) {
      degreeUpdates.push({ where: { id: current.id }, data });
    }
  }
  const deletedDegreeIds = existing.degrees
    .filter((row) => !seenDegreeStored.has(row.stored))
    .map((row) => {
      removedStored.push(row.stored);
      return row.id;
    });
  if (
    degreeCreates.length > 0 ||
    degreeUpdates.length > 0 ||
    deletedDegreeIds.length > 0
  ) {
    diff.degrees = {
      ...(degreeCreates.length > 0 ? { create: degreeCreates } : {}),
      ...(degreeUpdates.length > 0 ? { update: degreeUpdates } : {}),
      ...(deletedDegreeIds.length > 0
        ? { deleteMany: { id: { in: deletedDegreeIds } } }
        : {}),
    };
  }

  const certificateCreates: Prisma.CertificateCreateWithoutProfileInput[] = [];
  const certificateUpdates: NonNullable<
    ProfileRelationDiff["certificates"]
  >["update"] = [];
  const seenCertificateStored = new Set<string>();
  for (const entry of input.certificates) {
    const stored = entry.file!.stored;
    const uploadedAt = new Date(`${entry.uploadedAt}T00:00:00`);
    const organization = trimOrNull(entry.organization);
    const url = trimOrNull(entry.url);
    if (seenCertificateStored.has(stored)) {
      certificateCreates.push({
        label: entry.label,
        organization,
        url,
        uploadedAt,
        name: entry.file!.name,
        stored,
        type: entry.file!.type,
        size: entry.file!.size,
      });
      continue;
    }
    seenCertificateStored.add(stored);
    const current = existing.certificates.find((row) => row.stored === stored);
    if (!current) {
      certificateCreates.push({
        label: entry.label,
        organization,
        url,
        uploadedAt,
        name: entry.file!.name,
        stored,
        type: entry.file!.type,
        size: entry.file!.size,
      });
      continue;
    }
    const data: Prisma.CertificateUpdateWithoutProfileInput = {};
    if (current.label !== entry.label) data.label = entry.label;
    if (current.organization !== organization) data.organization = organization;
    if (current.url !== url) data.url = url;
    if (current.uploadedAt.getTime() !== uploadedAt.getTime()) {
      data.uploadedAt = uploadedAt;
    }
    if (current.name !== entry.file!.name) data.name = entry.file!.name;
    if (current.type !== entry.file!.type) data.type = entry.file!.type;
    if (current.size !== entry.file!.size) data.size = entry.file!.size;
    if (Object.keys(data).length > 0) {
      certificateUpdates.push({ where: { id: current.id }, data });
    }
  }
  const deletedCertificateIds = existing.certificates
    .filter((row) => !seenCertificateStored.has(row.stored))
    .map((row) => {
      removedStored.push(row.stored);
      return row.id;
    });
  if (
    certificateCreates.length > 0 ||
    certificateUpdates.length > 0 ||
    deletedCertificateIds.length > 0
  ) {
    diff.certificates = {
      ...(certificateCreates.length > 0 ? { create: certificateCreates } : {}),
      ...(certificateUpdates.length > 0
        ? { update: certificateUpdates }
        : {}),
      ...(deletedCertificateIds.length > 0
        ? { deleteMany: { id: { in: deletedCertificateIds } } }
        : {}),
    };
  }

  const linkCreates: Prisma.SocialLinkCreateWithoutProfileInput[] = [];
  const linkUpdates: NonNullable<
    ProfileRelationDiff["socialLinks"]
  >["update"] = [];
  const seenPlatforms = new Set<string>();
  for (const link of input.socialLinks) {
    if (seenPlatforms.has(link.platform)) {
      linkCreates.push({ platform: link.platform, url: link.url });
      continue;
    }
    seenPlatforms.add(link.platform);
    const current = existing.socialLinks.find(
      (row) => row.platform === link.platform
    );
    if (!current) {
      linkCreates.push({ platform: link.platform, url: link.url });
    } else if (current.url !== link.url) {
      linkUpdates.push({ where: { id: current.id }, data: { url: link.url } });
    }
  }
  const deletedLinkIds = existing.socialLinks
    .filter((row) => !seenPlatforms.has(row.platform))
    .map((row) => row.id);
  if (
    linkCreates.length > 0 ||
    linkUpdates.length > 0 ||
    deletedLinkIds.length > 0
  ) {
    diff.socialLinks = {
      ...(linkCreates.length > 0 ? { create: linkCreates } : {}),
      ...(linkUpdates.length > 0 ? { update: linkUpdates } : {}),
      ...(deletedLinkIds.length > 0
        ? { deleteMany: { id: { in: deletedLinkIds } } }
        : {}),
    };
  }

  const seenProjectLinks = new Set(
    input.projectLinks.map((link) => `${link.title}\n${link.url}`)
  );
  const projectLinkCreates = input.projectLinks
    .filter(
      (link, index, all) =>
        all.findIndex(
          (other) => other.title === link.title && other.url === link.url
        ) === index &&
        !existing.profileLinks.some(
          (row) => row.title === link.title && row.url === link.url
        )
    )
    .map((link) => ({ title: link.title, url: link.url }));
  const deletedProjectLinkIds = existing.profileLinks
    .filter((row) => !seenProjectLinks.has(`${row.title}\n${row.url}`))
    .map((row) => row.id);
  if (projectLinkCreates.length > 0 || deletedProjectLinkIds.length > 0) {
    diff.profileLinks = {
      ...(projectLinkCreates.length > 0
        ? { create: projectLinkCreates }
        : {}),
      ...(deletedProjectLinkIds.length > 0
        ? { deleteMany: { id: { in: deletedProjectLinkIds } } }
        : {}),
    };
  }

  return { ...diff, removedStored };
}
