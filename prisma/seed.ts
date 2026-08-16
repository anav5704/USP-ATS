import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { JOB_TYPES, USP_CAMPUSES, USP_DEPARTMENTS } from "@/lib/jobs/job-constants";
import {
  deadlineAtEndOfFijiDay,
  toFijiDate,
} from "@/lib/jobs/job-dates";
import { USP_DEGREES } from "@/lib/usp-degrees";

const SEED_COUNT = 50;
const SEED_ADMIN_EMAIL = "seed-admin@usp.ac.fj";
const SEED_ADMIN_NAME = "Seed Admin";

const TITLES = [
  "Teaching Assistant",
  "Research Assistant",
  "Student Research Assistant",
  "Data Assistant",
  "Finance Assistant",
  "Administrative Assistant",
  "Project Assistant",
  "Technical Assistant",
  "Student Officer",
  "Library Assistant",
  "Laboratory Assistant",
  "IT Support Assistant",
  "Front Desk Assistant",
  "Exam Invigilator",
  "Student Ambassador",
  "Peer Tutor",
  "Peer Mentor",
  "Tutor",
  "Marker",
  "Lab Demonstrator",
  "Social Media Assistant",
  "Campus Tour Guide",
  "PASS Leader",
  "Student Learning Specialist",
];

const DUTIES = [
  "support teaching staff with tutorials, marking, and student queries",
  "assist with data collection, entry, and analysis across faculty projects",
  "help prepare course materials and coordinate day-to-day administrative tasks",
  "provide IT and lab support, including maintaining shared equipment",
  "support outreach and student engagement activities on campus",
  "assist the finance team with reconciliations and record keeping",
  "help manage project timelines, meeting notes, and stakeholder updates",
  "support academic staff with literature reviews and report drafting",
];

const SKILLS = [
  "Microsoft Office",
  "Python",
  "Data analysis",
  "Communication",
  "Project management",
  "Customer service",
  "Web design",
  "Social media",
  "Graphic design",
  "Research",
  "Bookkeeping",
  "Teamwork",
  "Time management",
  "Problem solving",
  "Fluent in iTaukei",
  "Fluent in Hindi",
  "Public speaking",
  "Excel",
  "SQL",
];

const ALL_DEGREES = USP_DEGREES.flatMap((group) => group.options);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickMany<T>(items: readonly T[], max: number): T[] {
  const count = Math.min(items.length, 1 + Math.floor(Math.random() * max));
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function daysFromNowInFiji(days: number): Date {
  const target = new Date(Date.now() + days * 86_400_000);
  return deadlineAtEndOfFijiDay(toFijiDate(target));
}

function buildDescription(deps: {
  title: string;
  department: string;
  jt: string;
  campuses: string[];
  hours: number;
  pay: number;
}): string {
  const duty = pick(DUTIES);
  const campus = deps.campuses.join(" / ");
  const payLine =
    deps.pay > 0
      ? `Pay is FJD ${deps.pay.toFixed(2)} per hour.`
      : "This is an unpaid role (available for credit where applicable).";
  return `We are looking for a ${deps.title.toLowerCase()} (${deps.jt.toLowerCase()}) to join the ${deps.department} team at ${campus}. You will ${duty}, as well as help out with general faculty activities during peak periods. The role is expected to run for approximately ${6 + Math.floor(Math.random() * 12)} weeks. ${payLine} We value initiative, good communication, and a willingness to learn.`;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: { role: "admin" },
    create: {
      id: randomUUID(),
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      emailVerified: true,
      role: "admin",
    },
  });

  await prisma.jobPosting.deleteMany({ where: { createdById: admin.id } });

  const jobs = Array.from({ length: SEED_COUNT }, (_, index) => {
    const title = pick(TITLES);
    const department = pick(USP_DEPARTMENTS);
    const jt = pick(JOB_TYPES);
    const campuses = pickMany(USP_CAMPUSES, 3);
    const hours = 5 + Math.floor(Math.random() * 30);
    const pay = Math.random() < 0.25 ? 0 : 6 + Math.floor(Math.random() * 15);
    const gpaMin =
      Math.random() < 0.45 ? 2.0 + Math.floor(Math.random() * 15) / 10 : null;

    let deadline: Date;
    if (index % 7 === 0) deadline = daysFromNowInFiji(0);
    else if (index % 11 === 0) deadline = daysFromNowInFiji(1);
    else deadline = daysFromNowInFiji(2 + Math.floor(Math.random() * 39));

    return {
      title,
      department,
      jobType: jt,
      campus: campuses,
      gpaMin,
      degree: pickMany(ALL_DEGREES, 3),
      skills: pickMany(SKILLS, 6),
      hours,
      hourlyPay: pay,
      deadline,
      status: index >= SEED_COUNT - 4 ? ("ARCHIVED" as const) : ("ACTIVE" as const),
      createdById: admin.id,
      description: buildDescription({
        title,
        department,
        jt,
        campuses,
        hours,
        pay,
      }),
    };
  });

  await prisma.jobPosting.createMany({ data: jobs });

  const active = jobs.filter((job) => job.status === "ACTIVE").length;
  console.log(
    `Seeded ${jobs.length} job postings (${active} active, ${jobs.length - active} archived) as ${SEED_ADMIN_EMAIL}`,
  );

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });