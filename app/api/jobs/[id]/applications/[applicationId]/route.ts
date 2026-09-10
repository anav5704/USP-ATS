import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import { updateApplicationStatusSchema } from "@/lib/applications/application-schema";
import { canAdminChangeStatus } from "@/lib/applications/application-rules";

type RouteParams = {
  params: Promise<{ id: string; applicationId: string }>;
};

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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: jobId, applicationId } = await params;

  try {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, jobId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        coverLetter: true,
        job: { select: { id: true, title: true } },
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
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found for this job" },
        { status: 404 }
      );
    }

    const profile = application.student.profile;
    return NextResponse.json({
      id: application.id,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      coverLetter: application.coverLetter,
      job: application.job,
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
                  url: documentUrl(jobId, application.id, degree.stored),
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
                    jobId,
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
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load applicant details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id: jobId, applicationId } = await params;
  const raw: unknown = await request.json().catch(() => null);
  const parsed = updateApplicationStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application status" },
      { status: 400 }
    );
  }

  try {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, jobId },
      select: { id: true, status: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found for this job" },
        { status: 404 }
      );
    }

    if (!canAdminChangeStatus(application.status, parsed.data.status)) {
      return NextResponse.json(
        { error: "This application status can no longer be changed" },
        { status: 409 }
      );
    }

    const result = await prisma.application.updateMany({
      where: {
        id: application.id,
        jobId,
        status: application.status,
      },
      data: { status: parsed.data.status },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        { error: "This application changed. Refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      id: application.id,
      status: parsed.data.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update the application status" },
      { status: 500 }
    );
  }
}
