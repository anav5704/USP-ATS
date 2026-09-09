import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/jobs/require-api";
import { getApprovalStatus } from "@/lib/jobs/approval-status";

export async function GET() {
  const guard = await requireApiAdmin();
  if (!guard.ok) return guard.response;
  try {
    const postings = await prisma.jobPosting.findMany({
      where: { OR: [
        { status: "PENDING_APPROVAL" },
        { createdById: guard.session.user.id },
        { requestedById: guard.session.user.id },
      ] },
      orderBy: { requestedAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        requestedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
        rejectedBy: { select: { name: true, email: true } },
        _count: { select: { applications: true } },
      },
    });
    return NextResponse.json(postings.filter((posting) => getApprovalStatus(posting) !== null).map(({ _count, ...posting }) => ({
      ...posting,
      gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
      hourlyPay: Number(posting.hourlyPay),
      applicationCount: _count.applications,
    })));
  } catch {
    return NextResponse.json({ error: "Unable to load approval requests" }, { status: 500 });
  }
}
