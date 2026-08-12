"use server";

import { headers } from "next/headers";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deadlineAtEndOfFijiDay,
  startOfFijiDay,
  toFijiDate,
  todayInFiji,
} from "@/lib/jobs/job-dates";
import {
  jobInputSchema,
  type AdminJobDetail,
  type AdminJobListItem,
  type StudentJobListItem,
} from "@/lib/jobs/job-schema";
import { PostingStatus, Prisma } from "@/generated/prisma/client";

export type JobActionResult =
  | { success: true }
  | { success: false; error: string };

export type RemoveJobResult =
  | { success: true; outcome: "deleted" | "archived" }
  | { success: false; error: string };

export type JobListResult =
  | { success: true; jobs: AdminJobListItem[] }
  | { success: false; error: string };

export type JobDetailResult =
  | { success: true; job: AdminJobDetail }
  | { success: false; error: string };

export type StudentJobListResult =
  | { success: true; jobs: StudentJobListItem[] }
  | { success: false; error: string };

async function getAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in" };
  }
  if (session.user.role !== "admin") {
    return { success: false as const, error: "Admin access is required" };
  }

  return { success: true as const, userId: session.user.id };
}

function firstError(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid job posting data";
}

export async function getAdminJobPostings(): Promise<JobListResult> {
  const admin = await getAdmin();
  if (!admin.success) return admin;

  try {
    const postings = await prisma.jobPosting.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        department: true,
        jobType: true,
        campus: true,
        deadline: true,
        status: true,
        hourlyPay: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    });

    return {
      success: true,
      jobs: postings.map((posting) => ({
        id: posting.id,
        title: posting.title,
        description: posting.description,
        department: posting.department,
        jobType: posting.jobType,
        campus: posting.campus,
        deadline: posting.deadline.toISOString(),
        status: posting.status,
        hourlyPay: Number(posting.hourlyPay),
        applicationCount: posting._count.applications,
        createdAt: posting.createdAt.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Unable to load job postings" };
  }
}

export async function getAdminJobPosting(id: string): Promise<JobDetailResult> {
  const admin = await getAdmin();
  if (!admin.success) return admin;

  if (!id) return { success: false, error: "Job posting not found" };

  try {
    const posting = await prisma.jobPosting.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        department: true,
        jobType: true,
        campus: true,
        gpaMin: true,
        degree: true,
        skills: true,
        hours: true,
        hourlyPay: true,
        deadline: true,
      },
    });

    if (!posting) {
      return { success: false, error: "Job posting not found" };
    }

    return {
      success: true,
      job: {
        id: posting.id,
        title: posting.title,
        description: posting.description,
        department: posting.department as AdminJobDetail["department"],
        jobType: posting.jobType as AdminJobDetail["jobType"],
        campus: posting.campus as AdminJobDetail["campus"],
        gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
        degree: posting.degree ?? [],
        skills: posting.skills ?? [],
        hours: posting.hours ?? (undefined as unknown as number),
        hourlyPay: Number(posting.hourlyPay),
        deadline: toFijiDate(posting.deadline),
      },
    };
  } catch {
    return { success: false, error: "Unable to load the job posting" };
  }
}

export async function createJobPosting(raw: unknown): Promise<JobActionResult> {
  const parsed = jobInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed.error) };
  }

  const admin = await getAdmin();
  if (!admin.success) return admin;
  if (parsed.data.deadline < todayInFiji()) {
    return { success: false, error: "Deadline cannot be in the past" };
  }

  try {
    await prisma.jobPosting.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        department: parsed.data.department,
        jobType: parsed.data.jobType,
        campus: parsed.data.campus,
        gpaMin: parsed.data.gpaMin,
        degree: parsed.data.degree,
        skills: parsed.data.skills,
        hours: parsed.data.hours,
        hourlyPay: parsed.data.hourlyPay,
        deadline: deadlineAtEndOfFijiDay(parsed.data.deadline),
        status: PostingStatus.ACTIVE,
        createdById: admin.userId,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Unable to create the job posting" };
  }
}

export async function updateJobPosting(
  id: string,
  raw: unknown
): Promise<JobActionResult> {
  const parsed = jobInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed.error) };
  }

  const admin = await getAdmin();
  if (!admin.success) return admin;
  if (!id) return { success: false, error: "Job posting not found" };
  if (parsed.data.deadline < todayInFiji()) {
    return { success: false, error: "Deadline cannot be in the past" };
  }

  try {
    const result = await prisma.jobPosting.updateMany({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        department: parsed.data.department,
        jobType: parsed.data.jobType,
        campus: parsed.data.campus,
        gpaMin: parsed.data.gpaMin,
        degree: parsed.data.degree,
        skills: parsed.data.skills,
        hours: parsed.data.hours,
        hourlyPay: parsed.data.hourlyPay,
        deadline: deadlineAtEndOfFijiDay(parsed.data.deadline),
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Job posting not found" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Unable to update the job posting" };
  }
}

async function decideRemoval(id: string) {
  return prisma.$transaction(
    async (transaction) => {
      const posting = await transaction.jobPosting.findUnique({
        where: { id },
        select: {
          id: true,
          _count: { select: { applications: true } },
        },
      });

      if (!posting) return null;

      if (posting._count.applications === 0) {
        await transaction.jobPosting.delete({ where: { id } });
        return "deleted" as const;
      }

      await transaction.jobPosting.update({
        where: { id },
        data: { status: PostingStatus.ARCHIVED },
      });
      return "archived" as const;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function removeJobPosting(id: string): Promise<RemoveJobResult> {
  const admin = await getAdmin();
  if (!admin.success) return admin;
  if (!id) return { success: false, error: "Job posting not found" };

  try {
    let outcome: Awaited<ReturnType<typeof decideRemoval>>;

    try {
      outcome = await decideRemoval(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        outcome = await decideRemoval(id);
      } else {
        throw error;
      }
    }

    if (!outcome) {
      return { success: false, error: "Job posting not found" };
    }

    return { success: true, outcome };
  } catch {
    return { success: false, error: "Unable to remove the job posting" };
  }
}

async function getMember() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in" };
  }
  if (session.user.role === "admin") {
    return { success: false as const, error: "Student access is required" };
  }

  return { success: true as const };
}

export async function getStudentJobPostings(): Promise<StudentJobListResult> {
  const member = await getMember();
  if (!member.success) return member;

  try {
    const postings = await prisma.jobPosting.findMany({
      where: {
        status: PostingStatus.ACTIVE,
        deadline: { gte: startOfFijiDay(todayInFiji()) },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        department: true,
        jobType: true,
        campus: true,
        gpaMin: true,
        degree: true,
        skills: true,
        hours: true,
        hourlyPay: true,
        deadline: true,
      },
    });

    return {
      success: true,
      jobs: postings.map((posting) => ({
        id: posting.id,
        title: posting.title,
        description: posting.description,
        department: posting.department,
        jobType: posting.jobType,
        campus: posting.campus,
        gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
        degree: posting.degree,
        skills: posting.skills,
        hours: posting.hours,
        hourlyPay: Number(posting.hourlyPay),
        deadline: posting.deadline.toISOString(),
      })),
    };
  } catch {
    return { success: false, error: "Unable to load job postings" };
  }
}
