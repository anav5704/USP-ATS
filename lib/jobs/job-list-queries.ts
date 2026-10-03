import { prisma } from "@/lib/prisma";
import { PostingStatus, type Prisma } from "@/generated/prisma/client";
import { startOfFijiDay, todayInFiji } from "@/lib/jobs/job-dates";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import type {
  AdminJobFilters,
  StudentJobFilters,
} from "@/lib/jobs/job-filters";
import { pagedResult, type PageResult } from "@/lib/pagination";
import type {
  AdminJobListItem,
  StudentJobListItem,
} from "@/lib/jobs/job-schema";

type JobWhere = Prisma.JobPostingWhereInput;

function searchConditions(search: string): JobWhere[] {
  const term = search.trim();
  if (term === "") return [];
  const contains = { contains: term, mode: "insensitive" as const };
  return [
    {
      OR: [
        { title: contains },
        { description: contains },
        { department: contains },
      ],
    },
  ];
}

function sharedFilterConditions(filters: StudentJobFilters): JobWhere[] {
  const conditions: JobWhere[] = [...searchConditions(filters.search)];

  if (filters.jobType !== "") {
    conditions.push({ jobType: filters.jobType });
  }
  if (filters.campuses.length > 0) {
    conditions.push({ campus: { hasSome: filters.campuses } });
  }

  const gpaValue = Number(filters.gpaMin);
  if (filters.gpaMin !== "" && !Number.isNaN(gpaValue)) {
    conditions.push({ OR: [{ gpaMin: null }, { gpaMin: { lte: gpaValue } }] });
  }

  if (filters.degrees.length > 0) {
    conditions.push({
      OR: [{ degree: { isEmpty: true } }, { degree: { hasSome: filters.degrees } }],
    });
  }
  if (filters.skills.length > 0) {
    conditions.push({
      OR: [{ skills: { isEmpty: true } }, { skills: { hasSome: filters.skills } }],
    });
  }

  return conditions;
}

function statusConditions(statusLabel: string): JobWhere[] {
  if (statusLabel === "Active") {
    return [{ status: PostingStatus.ACTIVE, deadline: { gte: new Date() } }];
  }
  if (statusLabel === "Archived") {
    return [
      {
        OR: [
          { status: PostingStatus.ARCHIVED },
          { status: PostingStatus.ACTIVE, deadline: { lt: new Date() } },
        ],
      },
    ];
  }
  return [];
}

export type FeedGroup = "campus" | "degree" | "other";

export type FeedSectionsPage = PageResult<StudentJobListItem> & {
  totals: { campus: number; degree: number; other: number };
  appliedJobIds: string[];
};

const STUDENT_JOB_SELECT = {
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
} as const;

type StudentJobRow = {
  id: string;
  title: string;
  description: string;
  department: string;
  jobType: string;
  campus: string[];
  gpaMin: { toString(): string } | null;
  degree: string[];
  skills: string[];
  hours: number | null;
  hourlyPay: { toString(): string };
  benefit: string | null;
  deadline: Date;
  createdAt: Date;
};

function toStudentJobListItem(posting: StudentJobRow): StudentJobListItem {
  return {
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
  };
}
export async function getStudentJobSections(
  userId: string,
  filters: StudentJobFilters,
  group: FeedGroup,
  page: number,
  pageSize: number
): Promise<FeedSectionsPage> {
  const [profile, candidates, applied] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: {
        campuses: true,
        degrees: { select: { name: true } },
      },
    }),
    prisma.jobPosting.findMany({
      where: {
        status: PostingStatus.ACTIVE,
        pendingModificationId: null,
        deadline: { gte: startOfFijiDay(todayInFiji()) },
        AND: sharedFilterConditions(filters),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, campus: true, degree: true },
    }),
    prisma.application.findMany({
      where: { studentId: userId, status: { not: "WITHDRAWN" } },
      select: { jobId: true },
    }),
  ]);

  const studentCampuses = profile?.campuses ?? [];
  const studentDegrees = (profile?.degrees ?? []).map((degree) =>
    degree.name.trim().toLowerCase()
  );

  const grouped: Record<FeedGroup, string[]> = {
    campus: [],
    degree: [],
    other: [],
  };
  for (const candidate of candidates) {
    const matchesCampus =
      studentCampuses.length > 0 &&
      candidate.campus.some((campus) => studentCampuses.includes(campus));
    const matchesDegree =
      studentDegrees.length > 0 &&
      candidate.degree.some((degree) =>
        studentDegrees.includes(degree.trim().toLowerCase())
      );

    if (matchesCampus) grouped.campus.push(candidate.id);
    if (matchesDegree) grouped.degree.push(candidate.id);
    if (!matchesCampus && !matchesDegree) grouped.other.push(candidate.id);
  }

  const totals = {
    campus: grouped.campus.length,
    degree: grouped.degree.length,
    other: grouped.other.length,
  };
  const pageIds = grouped[group].slice((page - 1) * pageSize, page * pageSize);
  const rows =
    pageIds.length === 0
      ? []
      : await prisma.jobPosting.findMany({
          where: { id: { in: pageIds } },
          select: STUDENT_JOB_SELECT,
        });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const items = pageIds.flatMap((id) => {
    const row = byId.get(id);
    return row ? [toStudentJobListItem(row)] : [];
  });

  return {
    ...pagedResult(items, totals[group], page, pageSize),
    totals,
    appliedJobIds: applied.map((application) => application.jobId),
  };
}

export async function getAdminJobList(
  filters: AdminJobFilters,
  page: number,
  pageSize: number
): Promise<PageResult<AdminJobListItem>> {
  const where: JobWhere = {
    pendingModificationId: null,
    OR: [
      { status: "ACTIVE" },
      {
        status: "ARCHIVED",
        OR: [
          { approvedAt: { not: null } },
          { requestedById: null, rejectedAt: null },
        ],
      },
    ],
    AND: [
      ...sharedFilterConditions(filters),
      ...statusConditions(filters.status),
    ],
  };
  const [total, postings] = await Promise.all([
    prisma.jobPosting.count({ where }),
    prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
  ]);

  return pagedResult(
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
    })),
    total,
    page,
    pageSize
  );
}
