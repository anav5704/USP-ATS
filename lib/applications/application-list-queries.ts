import { prisma } from "@/lib/prisma";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import { pagedResult, type PageResult } from "@/lib/pagination";
import type { MyApplicationFilters } from "@/lib/applications/application-filters";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationListItem,
  type ApplicationStatus,
} from "@/lib/applications/application-schema";

function statusValue(label: string): ApplicationStatus | null {
  const entry = (
    Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][]
  ).find(([, value]) => value === label);
  return entry ? entry[0] : null;
}

export async function getMyApplications(
  userId: string,
  filters: MyApplicationFilters,
  page: number,
  pageSize: number
): Promise<PageResult<ApplicationListItem>> {
  const term = filters.search.trim();
  const status = filters.status === "" ? null : statusValue(filters.status);
  const where = {
    studentId: userId,
    ...(status ? { status } : {}),
    ...(term === ""
      ? {}
      : {
          OR: [
            { coverLetter: { contains: term, mode: "insensitive" as const } },
            { job: { title: { contains: term, mode: "insensitive" as const } } },
            {
              job: {
                department: { contains: term, mode: "insensitive" as const },
              },
            },
          ],
        }),
  };

  const [total, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        createdAt: true,
        coverLetter: true,
        job: {
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
        },
      },
    }),
  ]);

  return pagedResult(
    applications.map((application) => ({
      id: application.id,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      coverLetter: application.coverLetter,
      job: {
        id: application.job.id,
        title: application.job.title,
        description: application.job.description,
        department: application.job.department,
        jobType: application.job.jobType,
        campus: application.job.campus.map(normalizeCampusCentre),
        gpaMin:
          application.job.gpaMin === null
            ? null
            : Number(application.job.gpaMin),
        degree: application.job.degree,
        skills: application.job.skills,
        hours: application.job.hours,
        hourlyPay: Number(application.job.hourlyPay),
        benefit: application.job.benefit,
        deadline: application.job.deadline.toISOString(),
        createdAt: application.job.createdAt.toISOString(),
      },
    })),
    total,
    page,
    pageSize
  );
}
