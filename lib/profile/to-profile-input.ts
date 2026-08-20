import type {
  ProfileInput,
  FileRef,
} from "@/lib/profile/profile-schema";

export type ProfileModel = {
  phone: string | null;
  bio: string | null;
  skills: string[] | null;
  campuses: string[];
  degrees: {
    name: string;
    gpa: string | number;
    documentType: "transcript" | "degree";
    document: FileRef;
  }[];
  certificates: {
    label: string;
    organization: string;
    url: string;
    uploadedAt: string;
    file: FileRef;
  }[];
  socialLinks: { platform: string; url: string }[];
  profileLinks: { title: string; url: string }[];
};

export type ProfileResult = {
  phone: string | null;
  bio: string | null;
  skills: string[] | null;
  campuses: string[];
  degrees: {
    name: string;
    gpa: { toString(): string };
    documentType: "TRANSCRIPT" | "DEGREE";
    fileName: string;
    stored: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }[];
  certificates: {
    label: string;
    organization: string | null;
    url: string | null;
    uploadedAt: Date;
    name: string;
    stored: string;
    type: string;
    size: number;
  }[];
  socialLinks: { platform: string; url: string }[];
  profileLinks: { title: string; url: string }[];
};

export function toProfileModel(result: ProfileResult): ProfileModel {
  const fileRef = (file: {
    name: string;
    stored: string;
    type: string;
    size: number;
  }): FileRef => ({
    name: file.name,
    stored: file.stored,
    type: file.type,
    size: file.size,
  });

  return {
    phone: result.phone,
    bio: result.bio,
    skills: result.skills,
    campuses: result.campuses,
    degrees: result.degrees.map((degree) => ({
      name: degree.name,
      gpa: degree.gpa.toString(),
      documentType:
        degree.documentType === "DEGREE" ? "degree" : "transcript",
      document: fileRef({
        name: degree.fileName,
        stored: degree.stored,
        type: degree.type,
        size: degree.size,
      }),
    })),
    certificates: result.certificates.map((entry) => ({
      label: entry.label,
      organization: entry.organization ?? "",
      url: entry.url ?? "",
      uploadedAt: toDateInputValue(entry.uploadedAt),
      file: fileRef(entry),
    })),
    socialLinks: result.socialLinks.map((link) => ({
      platform: link.platform,
      url: link.url,
    })),
    profileLinks: result.profileLinks.map((link) => ({
      title: link.title,
      url: link.url,
    })),
  };
}

export function toProfileInput(profile: ProfileModel): ProfileInput {
  return {
    phone: profile.phone ?? "",
    bio: profile.bio ?? "",
    campuses: profile.campuses,
    skills: profile.skills ?? [],
    degrees: profile.degrees.map((degree) => ({
      name: degree.name,
      gpa: Number(degree.gpa),
      documentType: degree.documentType,
      document: degree.document,
    })),
    certificates: profile.certificates,
    socialLinks: profile.socialLinks,
    projectLinks: profile.profileLinks,
  };
}

function toDateInputValue(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}