import { ZodError } from "zod";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import type { Prisma } from "@/generated/prisma/client";

function toNullable(value: string) {
  return value.trim() === "" ? null : value.trim();
}

export function firstProfileError(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid profile data";
}

export type BuildProfileDataResult = {
  gpa: number;
  skills: string[];
  degrees: string[];
  campuses: string[];
  education:
    | { create: Prisma.EducationCreateWithoutProfileInput[] }
    | {
        deleteMany: Prisma.EducationScalarWhereInput;
        create: Prisma.EducationCreateWithoutProfileInput[];
      };
  projects:
    | { create: Prisma.ProjectCreateWithoutProfileInput[] }
    | {
        deleteMany: Prisma.ProjectScalarWhereInput;
        create: Prisma.ProjectCreateWithoutProfileInput[];
      };
};

export function buildProfileData(
  input: ProfileInput,
  replace: boolean
): BuildProfileDataResult {
  const education = input.education.map((entry) => ({
    institution: entry.institution,
    program: toNullable(entry.program),
  }));
  const projects = input.projects.map((project) => ({
    name: project.name,
    description: toNullable(project.description),
    link: toNullable(project.link),
  }));

  return {
    gpa: input.gpa,
    skills: input.skills,
    degrees: input.degrees,
    campuses: input.campuses,
    education: replace
      ? { deleteMany: {}, create: education }
      : { create: education },
    projects: replace
      ? { deleteMany: {}, create: projects }
      : { create: projects },
  };
}