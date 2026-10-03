import { rankApplicantsByScore } from "@/lib/applications/applicant-ranking";
import { prisma } from "@/lib/prisma";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import type { AdminApplicantsResponse } from "@/lib/applications/application-schema";

function applicantName(student: {
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  return (
    student.name.trim() ||
    [student.firstName, student.lastName].filter(Boolean).join(" ") ||
    student.email
  );
}

function documentUrl(
  jobId: string,
  applicationId: string,
  storedName: string
) {
  return `/api/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(
    applicationId
  )}/documents/${encodeURIComponent(storedName)}`;
}

export class AdminApplicantsNotFoundError extends Error {}

// Server-only data function shared by the API route and RSC prefetch.
export async function getAdminApplicants(
  jobId: string
): Promise<AdminApplicantsResponse> {
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      department: true,
      campus: true,
      applications: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          coverLetter: true,
          score: { select: { matchScore: true, status: true } },
          student: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  phone: true,
                  bio: true,
                  campuses: true,
                  skills: true,
                  degrees: {
                    orderBy: { uploadedAt: "asc" },
                    select: {
                      name: true,
                      gpa: true,
                      documentType: true,
                      fileName: true,
                      stored: true,
                      type: true,
                      size: true,
                    },
                  },
                  certificates: {
                    orderBy: { uploadedAt: "asc" },
                    select: {
                      label: true,
                      organization: true,
                      url: true,
                      uploadedAt: true,
                      name: true,
                      stored: true,
                      type: true,
                      size: true,
                    },
                  },
                  socialLinks: {
                    select: { platform: true, url: true },
                  },
                  profileLinks: {
                    select: { title: true, url: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!job) {
    throw new AdminApplicantsNotFoundError();
  }

  const rankedApplications = rankApplicantsByScore(job.applications);

  return {
    job: {
      id: job.id,
      title: job.title,
      department: job.department,
      campus: job.campus.map(normalizeCampusCentre),
    },
    applications: rankedApplications.map((application) => {
      const profile = application.student.profile;
      return {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt.toISOString(),
        coverLetter: application.coverLetter,
        score: application.score,
        applicant: {
          name: applicantName(application.student),
          email: application.student.email,
          profile: profile
            ? {
                phone: profile.phone,
                bio: profile.bio,
                campuses: profile.campuses.map(normalizeCampusCentre),
                skills: profile.skills,
                degrees: profile.degrees.map((degree) => ({
                  name: degree.name,
                  gpa: Number(degree.gpa),
                  documentType: degree.documentType,
                  document: {
                    name: degree.fileName,
                    type: degree.type,
                    size: degree.size,
                    url: documentUrl(job.id, application.id, degree.stored),
                  },
                })),
                certificates: profile.certificates.map((certificate) => ({
                  label: certificate.label,
                  organization: certificate.organization,
                  url: certificate.url,
                  uploadedAt: certificate.uploadedAt.toISOString(),
                  file: {
                    name: certificate.name,
                    type: certificate.type,
                    size: certificate.size,
                    url: documentUrl(
                      job.id,
                      application.id,
                      certificate.stored
                    ),
                  },
                })),
                socialLinks: profile.socialLinks,
                profileLinks: profile.profileLinks,
              }
            : null,
        },
      };
    }),
  };
}
