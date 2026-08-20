import type { FieldErrors, FieldPath } from "react-hook-form";
import {
  BookOpenIcon,
  Link2Icon,
  MedalIcon,
  UserRoundIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";

export type SectionId = "general" | "academic" | "certificates" | "links";

export type ProfileSection = {
  id: SectionId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  optional: boolean;
  fields: FieldPath<ProfileInput>[];
};

export const PROFILE_SECTIONS: ProfileSection[] = [
  {
    id: "general",
    label: "General details",
    shortLabel: "General",
    description: "Your campus or centre, phone number and a short bio.",
    icon: UserRoundIcon,
    optional: false,
    fields: ["phone", "campuses", "bio"],
  },
  {
    id: "academic",
    label: "Academic details",
    shortLabel: "Academic",
    description: "Your title, degree status, average GPA out of 4.5, technical skills and transcript.",
    icon: BookOpenIcon,
    optional: false,
    fields: ["title", "degrees", "gpa", "degreeStatus", "transcript", "skills"],
  },
  {
    id: "certificates",
    label: "Certificates",
    shortLabel: "Certificates",
    description: "Optional. Upload certificates and achievements.",
    icon: MedalIcon,
    optional: true,
    fields: ["certificates"],
  },
  {
    id: "links",
    label: "Links",
    shortLabel: "Links",
    description: "Optional. Social profiles and project links.",
    icon: Link2Icon,
    optional: true,
    fields: ["socialLinks", "projectLinks"],
  },
];

export function isSectionComplete(
  section: ProfileSection,
  values: ProfileInput,
  errors: FieldErrors<ProfileInput>
): boolean {
  switch (section.id) {
    case "general":
      return (
        values.campuses.length > 0 &&
        values.campuses.every((campus) => campus.trim().length > 0) &&
        !errors.campuses &&
        !errors.phone &&
        !errors.bio
      );
    case "academic": {
      const gpaOk =
        typeof values.gpa === "number" &&
        !Number.isNaN(values.gpa) &&
        values.gpa >= 0 &&
        values.gpa <= 4.5;
      return (
        values.degrees.length > 0 &&
        values.degrees.every((degree) => degree.trim().length > 0) &&
        !errors.degrees &&
        gpaOk &&
        values.skills.length > 0 &&
        values.transcript !== null &&
        !errors.gpa &&
        !errors.skills &&
        !errors.degreeStatus &&
        !errors.transcript
      );
    }
    case "certificates":
      return (
        !errors.certificates &&
        values.certificates.every(
          (entry) =>
            entry.label.trim().length > 0 &&
            entry.organization.trim().length > 0 &&
            entry.file !== null
        )
      );
    case "links":
      return (
        !errors.socialLinks &&
        !errors.projectLinks &&
        values.socialLinks.every(
          (link) => link.platform.trim().length > 0 && link.url.trim().length > 0
        ) &&
        values.projectLinks.every(
          (link) => link.title.trim().length > 0 && link.url.trim().length > 0
        )
      );
    default:
      return false;
  }
}