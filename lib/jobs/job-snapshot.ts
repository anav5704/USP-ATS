import type { Prisma } from "@/generated/prisma/client";
import { deadlineAtEndOfFijiDay, toFijiDate } from "@/lib/jobs/job-dates";
import {
  jobInputSchema,
  jobSnapshotSchema,
  type JobInput,
} from "@/lib/jobs/job-schema";

type JobSnapshotSource = {
  title: string;
  description: string;
  department: string;
  jobType: string;
  campus: string[];
  gpaMin: { toString(): string } | number | null;
  degree: string[];
  skills: string[];
  hours: number | null;
  hourlyPay: { toString(): string } | number;
  benefit: string | null;
  deadline: Date | string;
};

export function toJobSnapshot(posting: JobSnapshotSource): JobInput {
  return jobSnapshotSchema.parse({
    title: posting.title,
    description: posting.description,
    department: posting.department,
    jobType: posting.jobType,
    campus: posting.campus,
    gpaMin: posting.gpaMin === null ? null : Number(posting.gpaMin),
    degree: posting.degree,
    skills: posting.skills,
    hours: posting.hours,
    hourlyPay: Number(posting.hourlyPay),
    benefit: posting.benefit ?? "",
    deadline: toFijiDate(new Date(posting.deadline)),
  });
}

export function parseJobSnapshot(value: unknown) {
  return jobInputSchema.safeParse(value);
}

export function parsePreviousJobSnapshot(value: unknown) {
  return jobSnapshotSchema.safeParse(value);
}

export function toJsonSnapshot(input: JobInput): Prisma.InputJsonObject {
  return { ...input } as unknown as Prisma.InputJsonObject;
}

const UNARCHIVE_REQUEST_TYPE = "UNARCHIVE";

export function toUnarchiveJsonSnapshot(input: JobInput): Prisma.InputJsonObject {
  return {
    ...input,
    _requestType: UNARCHIVE_REQUEST_TYPE,
  } as unknown as Prisma.InputJsonObject;
}

export function isUnarchiveSnapshot(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "_requestType" in value &&
    value._requestType === UNARCHIVE_REQUEST_TYPE
  );
}

export function jobInputDatabaseData(input: JobInput) {
  return {
    title: input.title,
    description: input.description,
    department: input.department,
    jobType: input.jobType,
    campus: input.campus,
    gpaMin: input.gpaMin,
    degree: input.degree,
    skills: input.skills,
    hours: input.hours,
    hourlyPay: input.hourlyPay,
    benefit: input.benefit || null,
    deadline: deadlineAtEndOfFijiDay(input.deadline),
  };
}
