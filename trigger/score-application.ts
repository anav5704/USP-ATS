import { logger, task } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import {
  computeEligibilityGates,
  computeScoreResult,
  scoreModelSchema,
} from "@/lib/applications/score-schema";
import { buildScorePrompt } from "@/lib/applications/score-prompt";

async function markScoreFailed(applicationId: string) {
  await prisma.scoreResult.upsert({
    where: { applicationId },
    update: {
      status: "FAILED",
      matchScore: null,
      skillsScore: null,
      educationScore: null,
      motivationScore: null,
      eligible: null,
      qualificationFit: null,
      motivationFit: null,
      missingRequirements: [],
    },
    create: { applicationId, status: "FAILED" },
  });
}

export const scoreApplication = task({
  id: "score-application",
  // No automatic retries (per PRD): a failure writes FAILED for the admin
  // table to render. Retrying blind would burn API tokens on errors that
  // cannot succeed on a second attempt (bad request, retired model, auth).
  retry: {
    maxAttempts: 1,
  },
  // Score at most 2 applications at once. Deadline rushes queue up instead
  // of hitting Gemini all at once and tripping rate limits.
  queue: {
    name: "ai-scoring",
    concurrencyLimit: 2,
  },
  run: async (applicationId: string) => {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        coverLetter: true,
        job: {
          select: {
            title: true,
            department: true,
            jobType: true,
            description: true,
            gpaMin: true,
            degree: true,
            skills: true,
            hours: true,
            campus: true,
          },
        },
        student: {
          select: {
            profile: {
              select: {
                skills: true,
                bio: true,
                campuses: true,
                degrees: {
                  select: { name: true, gpa: true, documentType: true },
                },
                certificates: {
                  select: { label: true, organization: true },
                },
                profileLinks: {
                  select: { title: true, url: true },
                },
              },
            },
          },
        },
      },
    });

    // The posting may have been deleted (cascade) after the task was queued.
    if (!application) {
      logger.warn("Skipping scoring for missing application", { applicationId });
      return { applicationId, skipped: "not-found" };
    }

    const profile = application.student.profile;
    if (!profile) {
      logger.warn("Skipping scoring for application without a profile", {
        applicationId,
      });
      await markScoreFailed(applicationId);
      return { applicationId, skipped: "no-profile" };
    }

    try {
      const gpaMin =
        application.job.gpaMin === null
          ? null
          : Number(application.job.gpaMin);
      const degrees = profile.degrees.map((degree) => ({
        name: degree.name,
        gpa: Number(degree.gpa),
        documentType: degree.documentType,
      }));
      const facts = computeEligibilityGates(
        { gpaMin, campus: application.job.campus },
        { degrees, campuses: profile.campuses }
      );

      const { system, prompt } = buildScorePrompt(
        {
          title: application.job.title,
          department: application.job.department,
          jobType: application.job.jobType,
          description: application.job.description,
          gpaMin,
          degree: application.job.degree,
          skills: application.job.skills,
          hours: application.job.hours,
          campus: application.job.campus,
        },
        {
          skills: profile.skills,
          bio: profile.bio,
          degrees,
          certificates: profile.certificates.map((certificate) => ({
            label: certificate.label,
            organization: certificate.organization,
          })),
          projectLinks: profile.profileLinks.map((link) => ({
            title: link.title,
            url: link.url,
          })),
          campuses: profile.campuses,
        },
        application.coverLetter,
        facts
      );

      const { object } = await generateObject({
        model: google("gemini-3.6-flash"),
        schema: scoreModelSchema,
        // Zero randomness: the same application always scores the same way.
        temperature: 0,
        system,
        prompt,
      });

      const result = computeScoreResult(object, facts);
      await prisma.scoreResult.upsert({
        where: { applicationId },
        update: {
          status: "COMPLETE",
          matchScore: result.matchScore,
          skillsScore: result.skillsScore,
          educationScore: result.educationScore,
          motivationScore: result.motivationScore,
          eligible: result.eligible,
          qualificationFit: object.qualificationFit,
          motivationFit: object.motivationFit,
          missingRequirements: result.missingRequirements,
        },
        create: {
          applicationId,
          status: "COMPLETE",
          matchScore: result.matchScore,
          skillsScore: result.skillsScore,
          educationScore: result.educationScore,
          motivationScore: result.motivationScore,
          eligible: result.eligible,
          qualificationFit: object.qualificationFit,
          motivationFit: object.motivationFit,
          missingRequirements: result.missingRequirements,
        },
      });

      logger.info("Scoring complete", {
        applicationId,
        matchScore: result.matchScore,
        eligible: result.eligible,
      });
      return {
        applicationId,
        matchScore: result.matchScore,
        eligible: result.eligible,
      };
    } catch (error) {
      // Persist the failure so the admin table shows an error state, then
      // rethrow so the failure is visible in the trigger.dev dashboard.
      // maxAttempts is 1, so this never retries.
      logger.error("Scoring failed", { applicationId, error });
      await markScoreFailed(applicationId);
      throw error;
    }
  },
});
