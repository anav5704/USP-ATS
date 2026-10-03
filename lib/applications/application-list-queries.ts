import { prisma } from "@/lib/prisma";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import type { ApplicationListItem } from "@/lib/applications/application-schema";

// Server-only data function shared by the API route and RSC prefetch.
export async function getMyApplications(
  userId: string
): Promise<ApplicationListItem[]> {
  const applications = await prisma.application.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
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
  });

  return applications.map((application) => ({
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
  }));
}
