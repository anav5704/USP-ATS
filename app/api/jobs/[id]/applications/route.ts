import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    const job = await prisma.jobPosting.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        applications: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
            score: { select: { matchScore: true, status: true } },
            student: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                profile: { select: { campuses: true } },
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job posting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job: { id: job.id, title: job.title },
      applications: job.applications.map((application) => ({
        id: application.id,
        name: applicantName(application.student),
        campuses: (application.student.profile?.campuses ?? []).map(
          normalizeCampusCentre
        ),
        createdAt: application.createdAt.toISOString(),
        status: application.status,
        score: application.score,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load applicants" },
      { status: 500 }
    );
  }
}
