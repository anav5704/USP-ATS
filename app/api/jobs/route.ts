import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PostingStatus } from "@/generated/prisma/client";
import { jobInputSchema } from "@/lib/jobs/job-schema";
import { requireApiAdmin, requireApiMember } from "@/lib/jobs/require-api";
import {
  deadlineAtEndOfFijiDay,
  startOfFijiDay,
  todayInFiji,
} from "@/lib/jobs/job-dates";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import { pendingReviewData } from "@/lib/jobs/approval-schema";

export async function GET() {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

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
        benefit: true,
        deadline: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      postings.map((posting) => ({
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
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load job postings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const raw: unknown = await request.json().catch(() => null);
  const parsed = jobInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid job posting data" },
      { status: 400 }
    );
  }
  if (parsed.data.deadline < todayInFiji()) {
    return NextResponse.json(
      { error: "Deadline cannot be in the past" },
      { status: 400 }
    );
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
        benefit: parsed.data.benefit || null,
        deadline: deadlineAtEndOfFijiDay(parsed.data.deadline),
        createdById: guard.session.user.id,
        ...pendingReviewData(guard.session.user.id),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create the job posting" },
      { status: 500 }
    );
  }
}
