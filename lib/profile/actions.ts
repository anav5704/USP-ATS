"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  profileInputSchema,
  type ProfileInput,
} from "@/lib/profile/profile-schema";
import type { Prisma } from "@/generated/prisma/client";

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

function toNullable(value: string) {
  return value.trim() === "" ? null : value.trim();
}

function firstError(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid profile data";
}

type BuildDataResult = {
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

function buildData(input: ProfileInput, replace: boolean): BuildDataResult {
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

export async function createProfile(raw: unknown): Promise<ProfileActionResult> {
  const parsed = profileInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed.error) };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { success: false, error: "You must be signed in to create a profile" };
  }
  if (session.user.role === "admin") {
    return { success: false, error: "Admins do not have a student profile" };
  }

  const existing = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "A profile already exists for this account" };
  }

  await prisma.profile.create({
    data: {
      userId: session.user.id,
      ...buildData(parsed.data, false),
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateProfile(raw: unknown): Promise<ProfileActionResult> {
  const parsed = profileInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed.error) };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { success: false, error: "You must be signed in to update your profile" };
  }
  if (session.user.role === "admin") {
    return { success: false, error: "Admins do not have a student profile" };
  }

  const existing = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Profile not found" };
  }

  await prisma.profile.update({
    where: { id: existing.id },
    data: buildData(parsed.data, true),
  });

  revalidatePath("/profile", "layout");
  return { success: true };
}
