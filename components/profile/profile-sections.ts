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
    description: "Your campus or centre, phone number, a short bio and your technical skills.",
    icon: UserRoundIcon,
    optional: false,
    fields: ["phone", "campuses", "bio", "skills"],
  },
  {
    id: "academic",
    label: "Academic details",
    shortLabel: "Academic",
    description: "Each qualification with its GPA and a transcript or qualification upload.",
    icon: BookOpenIcon,
    optional: false,
    fields: ["degrees"],
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
        values.skills.length > 0 &&
        values.skills.every((skill) => skill.trim().length > 0) &&
        !errors.campuses &&
        !errors.phone &&
        !errors.bio &&
        !errors.skills
      );
    case "academic": {
      const gpaOk = (degree: ProfileInput["degrees"][number]) =>
        typeof degree.gpa === "number" &&
        !Number.isNaN(degree.gpa) &&
        degree.gpa >= 0 &&
        degree.gpa <= 4.5;
      return (
        values.degrees.length > 0 &&
        values.degrees.every(
          (degree) =>
            degree.name.trim().length > 0 &&
            gpaOk(degree) &&
            degree.document !== null
        ) &&
        !errors.degrees
      );
    }
    case "certificates":
      return true;
    case "links":
      return true;
    default:
      return false;
  }
}