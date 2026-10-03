import { prisma } from "@/lib/prisma";
import { PostingStatus } from "@/generated/prisma/client";
import { startOfFijiDay, todayInFiji } from "@/lib/jobs/job-dates";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import type {
  AdminJobListItem,
  StudentJobListItem,
} from "@/lib/jobs/job-schema";

// Server-only data functions shared by API routes and RSC prefetch.
// Shapes must stay identical to what client hooks expect from /api/*.
export async function getStudentJobFeed(): Promise<StudentJobListItem[]> {
  const postings = await prisma.jobPosting.findMany({
    where: {
      status: PostingStatus.ACTIVE,
      pendingModificationId: null,
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
      benefit: true,
      deadline: true,
      createdAt: true,
    },
  });

  return postings.map((posting) => ({
    id: posting.id,
    title: posting.title,
    description: posting.description,
    department: posting.department,
    jobType: posting.jobType,
    campus: posting.campus.map(normalizeCampusCentre),
    gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
    degree: posting.degree,
    skills: posting.skills,
    hours: posting.hours,
    hourlyPay: Number(posting.hourlyPay),
    benefit: posting.benefit,
    deadline: posting.deadline.toISOString(),
    createdAt: posting.createdAt.toISOString(),
  }));
}

export async function getAdminJobList(): Promise<AdminJobListItem[]> {
  const postings = await prisma.jobPosting.findMany({
    where: {
      pendingModificationId: null,
      OR: [
        { status: "ACTIVE" },
        {
          status: "ARCHIVED",
          OR: [
            { approvedAt: { not: null } },
            { requestedById: null, rejectedAt: null },
          ],
        },
      ],
    },
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
      rejectionReason: true,
      hourlyPay: true,
      benefit: true,
      createdAt: true,
      gpaMin: true,
      degree: true,
      skills: true,
      hours: true,
      _count: { select: { applications: true } },
    },
  });

  return postings.map((posting) => ({
    id: posting.id,
    title: posting.title,
    description: posting.description,
    department: posting.department,
    jobType: posting.jobType,
    campus: posting.campus.map(normalizeCampusCentre),
    deadline: posting.deadline.toISOString(),
    status: posting.status,
    rejectionReason: posting.rejectionReason,
    hourlyPay: Number(posting.hourlyPay),
    benefit: posting.benefit,
    applicationCount: posting._count.applications,
    createdAt: posting.createdAt.toISOString(),
    gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
    degree: posting.degree ?? [],
    skills: posting.skills ?? [],
    hours: posting.hours ?? (undefined as unknown as number),
  }));
}
