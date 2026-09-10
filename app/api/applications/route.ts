import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireApiMember } from "@/lib/jobs/require-api";
import { createApplicationSchema } from "@/lib/applications/application-schema";
import {
  submitApplication,
  SubmitApplicationError,
} from "@/lib/applications/submit-application";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";

export async function GET() {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  try {
    const applications = await prisma.application.findMany({
      where: { studentId: guard.session.user.id },
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

    return NextResponse.json(
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
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  const raw: unknown = await request.json().catch(() => null);
  const parsed = createApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application data" },
      { status: 400 }
    );
  }

  try {
    await submitApplication(
      prisma.application,
      prisma.jobPosting,
      guard.session.user.id,
      parsed.data
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SubmitApplicationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Unable to submit the application" },
      { status: 500 }
    );
  }
}