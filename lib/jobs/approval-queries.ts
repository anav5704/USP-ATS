import { prisma } from "@/lib/prisma";
import { getApprovalStatus } from "@/lib/jobs/approval-status";
import { deadlineAtEndOfFijiDay } from "@/lib/jobs/job-dates";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import {
  isUnarchiveSnapshot,
  parseJobSnapshot,
  parsePreviousJobSnapshot,
} from "@/lib/jobs/job-snapshot";
import { isOwnApprovalRequest } from "@/lib/jobs/approval-schema";
import { pagedResult, type PageResult } from "@/lib/pagination";
import type {
  ApprovalFilters,
  ApprovalTab,
} from "@/lib/jobs/approval-filters";
import type { ApprovalJob } from "@/lib/jobs/job-schema";

export type ApprovalPage = PageResult<ApprovalJob> & {
  totals: { mine: number; review: number };
};

function modificationApprovalStatus(status: string) {
  if (status === "APPROVED") return "Approved" as const;
  if (status === "REJECTED") return "Rejected" as const;
  return "Pending Approval" as const;
}

type LightRequest = {
  kind: "NEW_JOB" | "MODIFICATION" | "UNARCHIVE";
  key: string;
  approvalId: string;
  title: string;
  department: string;
  campus: string[];
  jobType: string;
  approvalStatus: "Pending Approval" | "Approved" | "Rejected" | null;
  own: boolean;
  requestedAt: Date;
};

function matchesLightRequest(
  request: LightRequest,
  filters: ApprovalFilters
): boolean {
  const search = filters.search.trim().toLowerCase();
  if (
    search !== "" &&
    ![request.title, request.department, ...request.campus].some((value) =>
      value.toLowerCase().includes(search)
    )
  ) {
    return false;
  }
  if (filters.requestType !== "" && request.kind !== filters.requestType) {
    return false;
  }
  if (filters.status !== "" && request.approvalStatus !== filters.status) {
    return false;
  }
  if (filters.jobType !== "" && request.jobType !== filters.jobType) {
    return false;
  }
  if (filters.campus !== "" && !request.campus.includes(filters.campus)) {
    return false;
  }
  return true;
}

export async function getApprovalPage(
  adminId: string,
  filters: ApprovalFilters,
  tab: ApprovalTab,
  page: number,
  pageSize: number
): Promise<ApprovalPage> {
  const [postings, modifications] = await Promise.all([
    prisma.jobPosting.findMany({
      where: {
        OR: [
          { status: "PENDING_APPROVAL" },
          { createdById: adminId },
          { requestedById: adminId },
        ],
      },
      select: {
        id: true,
        title: true,
        department: true,
        jobType: true,
        campus: true,
        status: true,
        createdById: true,
        requestedById: true,
        requestedAt: true,
        approvedAt: true,
        rejectedAt: true,
      },
    }),
    prisma.jobModificationRequest.findMany({
      where: {
        status: { not: "WITHDRAWN" },
        OR: [{ status: "PENDING" }, { requestedById: adminId }],
      },
      select: {
        id: true,
        jobId: true,
        status: true,
        requestedById: true,
        requestedAt: true,
        proposedData: true,
      },
    }),
  ]);

  const light: LightRequest[] = [];
  for (const posting of postings) {
    const approvalStatus = getApprovalStatus(posting);
    if (!approvalStatus) continue;
    light.push({
      kind: "NEW_JOB",
      key: `job:${posting.id}`,
      approvalId: posting.id,
      title: posting.title,
      department: posting.department,
      campus: posting.campus.map(normalizeCampusCentre),
      jobType: posting.jobType,
      approvalStatus,
      own:
        posting.createdById === adminId || posting.requestedById === adminId,
      requestedAt: posting.requestedAt,
    });
  }
  for (const request of modifications) {
    const proposed = parseJobSnapshot(request.proposedData);
    if (!proposed.success) continue;
    const unarchive = isUnarchiveSnapshot(request.proposedData);
    light.push({
      kind: unarchive ? "UNARCHIVE" : "MODIFICATION",
      key: `mod:${request.id}`,
      approvalId: request.id,
      title: proposed.data.title,
      department: proposed.data.department,
      campus: proposed.data.campus.map(normalizeCampusCentre),
      jobType: proposed.data.jobType,
      approvalStatus: modificationApprovalStatus(request.status),
      own: isOwnApprovalRequest(
        {
          createdById: "",
          requestedById: request.requestedById,
          requestType: unarchive ? "UNARCHIVE" : "MODIFICATION",
        },
        adminId
      ),
      requestedAt: request.requestedAt,
    });
  }

  const visible = light.filter((request) => matchesLightRequest(request, filters));
  const mine = visible.filter((request) => request.own);
  const review = visible.filter(
    (request) =>
      request.approvalStatus === "Pending Approval" && !request.own
  );
  const sortByRequested = (left: LightRequest, right: LightRequest) =>
    right.requestedAt.getTime() - left.requestedAt.getTime();
  mine.sort(sortByRequested);
  review.sort(sortByRequested);

  const active = tab === "mine" ? mine : review;
  const totals = { mine: mine.length, review: review.length };
  const pageKeys = active
    .slice((page - 1) * pageSize, page * pageSize)
    .map((request) => request.approvalId);
  const pageSet = new Set(pageKeys);

  const [pagePostings, pageModifications] = await Promise.all([
    prisma.jobPosting.findMany({
      where: {
        id: {
          in: active
            .filter((request) => request.kind === "NEW_JOB")
            .map((request) => request.approvalId)
            .filter((id) => pageSet.has(id)),
        },
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
        id: {
          in: active
            .filter((request) => request.kind !== "NEW_JOB")
            .map((request) => request.approvalId)
            .filter((id) => pageSet.has(id)),
        },
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

  const newJobRequests = pagePostings.flatMap(({ _count, ...posting }) => {
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

  const modificationRequests = pageModifications.map((request) => {
    const proposed = parseJobSnapshot(request.proposedData);
    const previous = parsePreviousJobSnapshot(request.previousData);
    if (!proposed.success || !previous.success) {
      throw new Error("Stored job modification data is invalid");
    }

    const approved = request.status === "APPROVED";
    const rejected = request.status === "REJECTED";

    const unarchive = isUnarchiveSnapshot(request.proposedData);

    return {
      id: request.job.id,
      approvalId: request.id,
      jobId: request.job.id,
      requestType: unarchive ? ("UNARCHIVE" as const) : ("MODIFICATION" as const),
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

  const byApprovalId = new Map(
    [...newJobRequests, ...modificationRequests].map((job) => [
      job.approvalId,
      job,
    ])
  );
  const items = pageKeys.flatMap((id) => {
    const job = byApprovalId.get(id);
    return job ? [job as ApprovalJob] : [];
  });

  return {
    ...pagedResult(items, active.length, page, pageSize),
    totals,
  };
}
