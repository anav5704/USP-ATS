import { prisma } from "@/lib/prisma";
import { getApprovalStatus } from "@/lib/jobs/approval-status";
import { deadlineAtEndOfFijiDay } from "@/lib/jobs/job-dates";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import {
  parseJobSnapshot,
  parsePreviousJobSnapshot,
} from "@/lib/jobs/job-snapshot";
import type { ApprovalJob } from "@/lib/jobs/job-schema";

function modificationApprovalStatus(status: string) {
  if (status === "APPROVED") return "Approved" as const;
  if (status === "REJECTED") return "Rejected" as const;
  return "Pending Approval" as const;
}

export async function getApprovals(
  adminId: string
): Promise<ApprovalJob[]> {
  const [postings, modifications] = await Promise.all([
    prisma.jobPosting.findMany({
      where: {
        OR: [
          { status: "PENDING_APPROVAL" },
          { createdById: adminId },
          { requestedById: adminId },
        ],
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        requestedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
        rejectedBy: { select: { name: true, email: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.jobModificationRequest.findMany({
      where: {
        status: { not: "WITHDRAWN" },
        OR: [{ status: "PENDING" }, { requestedById: adminId }],
      },
      include: {
        requestedBy: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true, email: true } },
        job: {
          include: {
            createdBy: { select: { name: true, email: true } },
            _count: { select: { applications: true } },
          },
        },
      },
    }),
  ]);

  const newJobRequests = postings.flatMap(({ _count, ...posting }) => {
    const approvalStatus = getApprovalStatus(posting);
    if (!approvalStatus) return [];

    return [
      {
        ...posting,
        id: posting.id,
        approvalId: posting.id,
        jobId: posting.id,
        requestType: "NEW_JOB" as const,
        approvalStatus,
        originalJob: null,
        campus: posting.campus.map(normalizeCampusCentre),
        gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
        hourlyPay: Number(posting.hourlyPay),
        deadline: posting.deadline.toISOString(),
        createdAt: posting.createdAt.toISOString(),
        requestedAt: posting.requestedAt.toISOString(),
        approvedAt: posting.approvedAt?.toISOString() ?? null,
        rejectedAt: posting.rejectedAt?.toISOString() ?? null,
        applicationCount: _count.applications,
      },
    ];
  });

  const modificationRequests = modifications.map((request) => {
    const proposed = parseJobSnapshot(request.proposedData);
    const previous = parsePreviousJobSnapshot(request.previousData);
    if (!proposed.success || !previous.success) {
      throw new Error("Stored job modification data is invalid");
    }

    const approved = request.status === "APPROVED";
    const rejected = request.status === "REJECTED";

    return {
      id: request.job.id,
      approvalId: request.id,
      jobId: request.job.id,
      requestType: "MODIFICATION" as const,
      approvalStatus: modificationApprovalStatus(request.status),
      originalJob: previous.data,
      title: proposed.data.title,
      description: proposed.data.description,
      department: proposed.data.department,
      jobType: proposed.data.jobType,
      campus: proposed.data.campus.map(normalizeCampusCentre),
      gpaMin: proposed.data.gpaMin,
      degree: proposed.data.degree,
      skills: proposed.data.skills,
      hours: proposed.data.hours,
      hourlyPay: proposed.data.hourlyPay,
      benefit: proposed.data.benefit || null,
      deadline: deadlineAtEndOfFijiDay(proposed.data.deadline).toISOString(),
      status: request.job.status,
      applicationCount: request.job._count.applications,
      createdAt: request.job.createdAt.toISOString(),
      createdById: request.job.createdById,
      requestedById: request.requestedById,
      createdBy: request.job.createdBy,
      requestedBy: request.requestedBy,
      requestedAt: request.requestedAt.toISOString(),
      approvedBy: approved ? request.reviewedBy : null,
      rejectedBy: rejected ? request.reviewedBy : null,
      approvedAt:
        approved && request.reviewedAt
          ? request.reviewedAt.toISOString()
          : null,
      rejectedAt:
        rejected && request.reviewedAt
          ? request.reviewedAt.toISOString()
          : null,
      rejectionReason: request.rejectionReason,
      revision: request.revision,
    };
  });

  return [...newJobRequests, ...modificationRequests].sort(
    (left, right) =>
      new Date(right.requestedAt).getTime() -
      new Date(left.requestedAt).getTime()
  ) as ApprovalJob[];
}
