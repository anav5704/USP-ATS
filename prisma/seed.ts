import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  JOB_TYPES,
  USP_CAMPUSES_CENTRES,
  USP_DEPARTMENTS,
} from "@/lib/jobs/job-constants";
import {
  deadlineAtEndOfFijiDay,
  toFijiDate,
} from "@/lib/jobs/job-dates";
import { USP_DEGREES } from "@/lib/usp-degrees";
import { getPoolConfig } from "@/lib/db-connection";

const JOB_COUNT = 500;
const MIN_APPLICATIONS_PER_JOB = 4;
const MAX_APPLICATIONS_PER_JOB = 6;

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

const COVER_LETTERS = [
  "I am excited to apply for this role. My coursework and campus involvement have prepared me well, and I am eager to contribute while learning from the team.",
  "This position matches my skills and availability. I am reliable, organized, and comfortable working independently or as part of a team.",
  "I would welcome the opportunity to support this department. I bring strong communication skills and a solid academic record.",
  "Applying because this role fits my degree and interests. I have relevant project experience and can start immediately.",
  "I am keen to gain practical experience alongside my studies. I am a fast learner and take pride in producing quality work.",
];

const FIT_NOTES = [
  "Strong alignment between the applicant's coursework and the role requirements.",
  "Relevant project experience, though some listed skills are not evidenced.",
  "Good general fit with solid academic standing and transferable experience.",
  "Motivated applicant with adjacent experience; some upskilling may be needed.",
];

const MISSING_SKILLS_POOL = [
  "Advanced Excel",
  "Laboratory safety certification",
  "Weekend availability",
  "Prior tutoring experience",
  "Report writing",
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

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg(getPoolConfig(process.env.DATABASE_URL)),
  });
  const runTag = Date.now().toString(36);

  try {
    const [admins, members] = await Promise.all([
      prisma.user.findMany({
        where: { role: "admin" },
        select: { id: true },
      }),
      prisma.user.findMany({
        where: { role: "member" },
        select: { id: true },
      }),
    ]);
    const ADMIN_IDS = admins.map((user) => user.id);
    const MEMBER_IDS = members.map((user) => user.id);
    if (ADMIN_IDS.length === 0) {
      throw new Error("Aborting: no users with role admin found in the database.");
    }
    if (MEMBER_IDS.length === 0) {
      throw new Error("Aborting: no users with role member found in the database.");
    }

    const profiles = await prisma.profile.findMany({
      where: { userId: { in: MEMBER_IDS } },
      select: { userId: true },
    });
    const hasProfile = new Set(profiles.map((profile) => profile.userId));
    let profilesCreated = 0;
    for (const memberId of MEMBER_IDS) {
      if (hasProfile.has(memberId)) continue;
      const degreeCount = 1 + Math.floor(Math.random() * 2);
      const certCount = Math.floor(Math.random() * 3);
      await prisma.profile.create({
        data: {
          userId: memberId,
          phone: `+679 9${Math.floor(100_000 + Math.random() * 899_999)}`,
          bio: "Final-year student seeking part-time campus work. Reliable, organized, and keen to learn.",
          skills: pickMany(SKILLS, 6),
          campuses: pickMany(USP_CAMPUSES_CENTRES, 2),
          degrees: {
            create: Array.from({ length: degreeCount }, (_, i) => ({
              name: pick(ALL_DEGREES),
              gpa: 2.5 + Math.floor(Math.random() * 20) / 10,
              documentType: "TRANSCRIPT",
              fileName: `transcript-${memberId.slice(0, 6)}-${i}.pdf`,
              stored: `seed-${memberId.slice(0, 8)}-transcript-${i}-${Date.now()}.pdf`,
              type: "application/pdf",
              size: 120_000 + Math.floor(Math.random() * 400_000),
            })),
          },
          certificates: {
            create: Array.from({ length: certCount }, (_, i) => ({
              label: pick(["First Aid", "Computer Literacy", "Customer Service", "Leadership Workshop"]),
              organization: pick(["USP", "Red Cross Fiji", "Coursera", "FNU"]),
              url: null,
              uploadedAt: daysAgo(Math.floor(Math.random() * 400)),
              name: `certificate-${memberId.slice(0, 6)}-${i}.pdf`,
              stored: `seed-${memberId.slice(0, 8)}-certificate-${i}-${Date.now()}.pdf`,
              type: "application/pdf",
              size: 80_000 + Math.floor(Math.random() * 300_000),
            })),
          },
          socialLinks: {
            create: [{ platform: "LinkedIn", url: `https://linkedin.com/in/seed-${memberId.slice(0, 8)}` }],
          },
          profileLinks: {
            create: [{ title: "Portfolio", url: `https://example.com/seed-${memberId.slice(0, 8)}` }],
          },
        },
      });
      profilesCreated += 1;
    }

    const jobs = Array.from({ length: JOB_COUNT }, (_, index) => {
      const title = pick(TITLES);
      const department = pick(USP_DEPARTMENTS);
      const jt = pick(JOB_TYPES);
      const campuses = pickMany(USP_CAMPUSES_CENTRES, 3);
      const hours = 5 + Math.floor(Math.random() * 30);
      const pay = Math.random() < 0.25 ? 0 : 6 + Math.floor(Math.random() * 15);
      const gpaMin =
        Math.random() < 0.45 ? 2.0 + Math.floor(Math.random() * 15) / 10 : null;
      const createdById = pick(ADMIN_IDS);
      const approvedAt = daysAgo(Math.floor(Math.random() * 80));

      let deadline: Date;
      let status: "ACTIVE" | "ARCHIVED";
      const roll = index % 10;
      if (roll < 7) {
        deadline = daysFromNowInFiji(1 + Math.floor(Math.random() * 45));
        status = "ACTIVE";
      } else if (roll < 8) {
        deadline = daysFromNowInFiji(0);
        status = "ACTIVE";
      } else if (roll < 9) {
        deadline = daysAgo(1 + Math.floor(Math.random() * 30));
        status = "ACTIVE";
      } else {
        deadline = daysAgo(1 + Math.floor(Math.random() * 60));
        status = "ARCHIVED";
      }

      return {
        id: `seed-job-${runTag}-${index}`,
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
        status,
        createdById,
        requestedById: createdById,
        requestedAt: daysAgo(Math.floor(Math.random() * 85)),
        approvedById: createdById,
        approvedAt,
        description: buildDescription({ title, department, jt, campuses, hours, pay }),
        createdAt: daysAgo(Math.floor(Math.random() * 90)),
      };
    });

    let jobsCreated = 0;
    for (const batch of chunk(jobs, 100)) {
      const result = await prisma.jobPosting.createMany({ data: batch });
      jobsCreated += result.count;
    }
    const jobIds = jobs.map((job) => job.id);

    const statuses = ["APPLIED", "APPLIED", "APPLIED", "APPLIED", "SHORTLISTED", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;
    const applications = jobIds.flatMap((jobId, jobIndex) => {
      const count =
        MIN_APPLICATIONS_PER_JOB +
        Math.floor(Math.random() * (MAX_APPLICATIONS_PER_JOB - MIN_APPLICATIONS_PER_JOB + 1));
      const shuffled = [...MEMBER_IDS].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, MEMBER_IDS.length)).map((studentId, appIndex) => ({
        id: `seed-app-${runTag}-${jobIndex}-${appIndex}`,
        jobId,
        studentId,
        coverLetter: pick(COVER_LETTERS),
        status: pick(statuses),
        createdAt: daysAgo(Math.floor(Math.random() * 60)),
      }));
    });

    let applicationsCreated = 0;
    for (const batch of chunk(applications, 500)) {
      const result = await prisma.application.createMany({ data: batch, skipDuplicates: true });
      applicationsCreated += result.count;
    }
    const applicationIds = applications.map((application) => application.id);

    const scores = applicationIds.map((applicationId) => {
      const roll = Math.random();
      if (roll < 0.88) {
        const matchScore = 20 + Math.floor(Math.random() * 79);
        return {
          applicationId,
          matchScore,
          skillsScore: 20 + Math.floor(Math.random() * 79),
          educationScore: 20 + Math.floor(Math.random() * 79),
          motivationScore: 20 + Math.floor(Math.random() * 79),
          eligible: matchScore >= 50,
          qualificationFit: pick(FIT_NOTES),
          motivationFit: pick(FIT_NOTES),
          missingRequirements: pickMany(MISSING_SKILLS_POOL, 3),
          status: "COMPLETE" as const,
        };
      }
      if (roll < 0.94) {
        return { applicationId, status: "FAILED" as const, missingRequirements: [] as string[] };
      }
      return { applicationId, status: "PENDING" as const, missingRequirements: [] as string[] };
    });

    let scoresCreated = 0;
    for (const batch of chunk(scores, 500)) {
      const result = await prisma.scoreResult.createMany({ data: batch, skipDuplicates: true });
      scoresCreated += result.count;
    }

    console.log(
      `Seed complete (additive, no rows deleted): ${jobsCreated} jobs across ${ADMIN_IDS.length} admins, ${applicationsCreated} applications across ${MEMBER_IDS.length} members, ${scoresCreated} score results, ${profilesCreated} profiles created for members missing one.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
