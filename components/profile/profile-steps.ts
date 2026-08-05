import type { FieldErrors, FieldPath } from "react-hook-form";
import {
  BookOpenIcon,
  FolderGit2Icon,
  GraduationCapIcon,
  SchoolIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfileInput } from "@/lib/profile/profile-schema";

export type StepId = "academic" | "degrees" | "education" | "projects";

export type ProfileStep = {
  id: StepId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  optional: boolean;
  fields: FieldPath<ProfileInput>[];
};

export const PROFILE_STEPS: ProfileStep[] = [
  {
    id: "academic",
    label: "Academic details",
    shortLabel: "Academic",
    description: "Your average GPA out of 4.5 and technical skills.",
    icon: BookOpenIcon,
    optional: false,
    fields: ["gpa", "skills"],
  },
  {
    id: "degrees",
    label: "Degrees",
    shortLabel: "Degrees",
    description: "Add at least one degree you have earned.",
    icon: GraduationCapIcon,
    optional: false,
    fields: ["degrees"],
  },
  {
    id: "education",
    label: "Education history",
    shortLabel: "Education",
    description: "Add at least one education entry.",
    icon: SchoolIcon,
    optional: false,
    fields: ["education"],
  },
  {
    id: "projects",
    label: "Personal projects",
    shortLabel: "Projects",
    description: "Optional. Projects are a positive signal on your profile.",
    icon: FolderGit2Icon,
    optional: true,
    fields: ["projects"],
  },
];

export function isStepComplete(
  step: ProfileStep,
  values: ProfileInput,
  errors: FieldErrors<ProfileInput>
): boolean {
  switch (step.id) {
    case "academic": {
      const gpaOk =
        typeof values.gpa === "number" &&
        !Number.isNaN(values.gpa) &&
        values.gpa >= 0 &&
        values.gpa <= 4.5;
      return gpaOk && values.skills.trim().length > 0 && !errors.gpa && !errors.skills;
    }
    case "degrees":
      return (
        values.degrees.length > 0 &&
        values.degrees.every((degree) => degree.name.trim().length > 0) &&
        !errors.degrees
      );
    case "education":
      return (
        values.education.length > 0 &&
        values.education.every((entry) => entry.institution.trim().length > 0) &&
        !errors.education
      );
    case "projects":
      return (
        values.projects.length > 0 &&
        values.projects.every((project) => project.name.trim().length > 0) &&
        !errors.projects
      );
    default:
      return false;
  }
}
