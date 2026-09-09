import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";

export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;

  try {
    const postings = await prisma.jobPosting.findMany({
      where: { OR: [
        { status: "ACTIVE" },
        { status: "ARCHIVED", OR: [
          { approvedAt: { not: null } },
          { requestedById: null, rejectedAt: null },
        ] },
      ] },
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

    return NextResponse.json(
      postings.map((posting) => ({
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
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load job postings" },
      { status: 500 }
    );
  }
}
