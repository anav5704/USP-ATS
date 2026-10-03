import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobInputSchema } from "@/lib/jobs/job-schema";
import { requireApiAdmin, requireApiMember } from "@/lib/jobs/require-api";
import {
  deadlineAtEndOfFijiDay,
  todayInFiji,
} from "@/lib/jobs/job-dates";
import { getStudentJobSections, type FeedGroup } from "@/lib/jobs/job-list-queries";
import { searchParamsToStudentJobFilters } from "@/lib/jobs/job-filters";
import { parsePageParams, FEED_PAGE_SIZE } from "@/lib/pagination";
import { pendingReviewData } from "@/lib/jobs/approval-schema";

export async function GET(request: NextRequest) {
  const guard = await requireApiMember();
  if (!guard.ok) return guard.response;

  try {
    const params = request.nextUrl.searchParams;
    const filters = searchParamsToStudentJobFilters(params);
    const groupParam = params.get("group");
    const group: FeedGroup =
      groupParam === "degree" || groupParam === "other" ? groupParam : "campus";
    const { page, pageSize } = parsePageParams(params, FEED_PAGE_SIZE);
    return NextResponse.json(
      await getStudentJobSections(
        guard.session.user.id,
        filters,
        group,
        page,
        pageSize
      )
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
