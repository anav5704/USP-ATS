import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobInputSchema } from "@/lib/jobs/job-schema";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { deadlineAtEndOfFijiDay } from "@/lib/jobs/job-dates";
import { removeJobPostingById } from "@/lib/jobs/remove-job";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
  }

  const raw: unknown = await request.json().catch(() => null);
  const parsed = jobInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid job posting data" },
      { status: 400 }
    );
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
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to update the job posting" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
  }

  try {
    const outcome = await removeJobPostingById(id);
    if (!outcome) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }
    return NextResponse.json({ outcome });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove the job posting" },
      { status: 500 }
    );
  }
}