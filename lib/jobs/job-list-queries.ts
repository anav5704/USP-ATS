import { prisma } from "@/lib/prisma";
import { PostingStatus, type Prisma } from "@/generated/prisma/client";
import { startOfFijiDay, todayInFiji } from "@/lib/jobs/job-dates";
import { normalizeCampusCentre } from "@/lib/jobs/job-constants";
import type {
  AdminJobFilters,
  StudentJobFilters,
} from "@/lib/jobs/job-filters";
import type {
  AdminJobListItem,
  JobFeedSections,
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

export async function getStudentJobFeed(
  filters: StudentJobFilters
): Promise<StudentJobListItem[]> {
  const postings = await prisma.jobPosting.findMany({
    where: {
      status: PostingStatus.ACTIVE,
      pendingModificationId: null,
      deadline: { gte: startOfFijiDay(todayInFiji()) },
      AND: sharedFilterConditions(filters),
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

  return postings.map((posting) => ({
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
  }));
}

export async function getStudentJobSections(
  userId: string,
  filters: StudentJobFilters
): Promise<JobFeedSections> {
  const [jobs, profile] = await Promise.all([
    getStudentJobFeed(filters),
    prisma.profile.findUnique({
      where: { userId },
      select: {
        campuses: true,
        degrees: { select: { name: true } },
      },
    }),
  ]);

  const studentCampuses = profile?.campuses ?? [];
  const studentDegrees = (profile?.degrees ?? []).map((degree) =>
    degree.name.trim().toLowerCase()
  );

  const campusMatchedJobs: StudentJobListItem[] = [];
  const degreeMatchedJobs: StudentJobListItem[] = [];
  const otherJobs: StudentJobListItem[] = [];

  for (const job of jobs) {
    const matchesCampus =
      studentCampuses.length > 0 &&
      job.campus.some((campus) => studentCampuses.includes(campus));
    const matchesDegree =
      studentDegrees.length > 0 &&
      job.degree.some((degree) =>
        studentDegrees.includes(degree.trim().toLowerCase())
      );

    if (matchesCampus) campusMatchedJobs.push(job);
    if (matchesDegree) degreeMatchedJobs.push(job);
    if (!matchesCampus && !matchesDegree) otherJobs.push(job);
  }

  return { campusMatchedJobs, degreeMatchedJobs, otherJobs };
}

export async function getAdminJobList(
  filters: AdminJobFilters
): Promise<AdminJobListItem[]> {
  const postings = await prisma.jobPosting.findMany({
    where: {
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
    },
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

  return postings.map((posting) => ({
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
  }));
}
