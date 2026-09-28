import { logger, task } from "@trigger.dev/sdk";
import { APICallError, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import {
  computeEligibilityGates,
  computeScoreResult,
  scoreModelSchema,
} from "@/lib/applications/score-schema";
import { buildScorePrompt } from "@/lib/applications/score-prompt";

const SCORING_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];
const ATTEMPTS_PER_MODEL = 3;
const BASE_DELAY_MS = 2_000;
const TRANSIENT_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const TRANSIENT_MESSAGE =
  /high demand|overload|capacity|rate.?limit|too many requests|resource.?exhausted|unavailable|try again later|temporar|timeout|timed out|fetch failed|econnreset|socket hang up|internal error/i;

function hasTransientMarker(error: unknown, depth = 0): boolean {
  if (depth > 5 || error == null) return false;
  if (typeof error === "string") return TRANSIENT_MESSAGE.test(error);
  if (error instanceof APICallError) {
    if (
      error.statusCode !== undefined &&
      TRANSIENT_STATUS_CODES.has(error.statusCode)
    ) {
      return true;
    }
    if (error.isRetryable) return true;
    if (TRANSIENT_MESSAGE.test(error.message)) return true;
    return hasTransientMarker(error.responseBody, depth + 1);
  }
  if (error instanceof Error) {
    if (TRANSIENT_MESSAGE.test(error.message)) return true;
    if (
      "errors" in error &&
      Array.isArray((error as { errors: unknown[] }).errors)
    ) {
      return (error as { errors: unknown[] }).errors.some((inner) =>
        hasTransientMarker(inner, depth + 1)
      );
    }
    return hasTransientMarker(error.cause, depth + 1);
  }
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (
      typeof record.message === "string" &&
      TRANSIENT_MESSAGE.test(record.message)
    ) {
      return true;
    }
    if (
      typeof record.statusCode === "number" &&
      TRANSIENT_STATUS_CODES.has(record.statusCode)
    ) {
      return true;
    }
    return hasTransientMarker(record.cause, depth + 1);
  }
  return false;
}

function isTransientScoringError(error: unknown): boolean {
  return hasTransientMarker(error, 0);
}

function backoffDelayMs(attempt: number): number {
  return BASE_DELAY_MS * 2 ** attempt + Math.random() * BASE_DELAY_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateScoreObject(
  applicationId: string,
  system: string,
  prompt: string
) {
  let lastError: unknown;

  for (let modelIndex = 0; modelIndex < SCORING_MODELS.length; modelIndex += 1) {
    const model = SCORING_MODELS[modelIndex] as string;
    const isLastModel = modelIndex === SCORING_MODELS.length - 1;

    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt += 1) {
      try {
        const { object } = await generateObject({
          model: google(model),
          schema: scoreModelSchema,
          temperature: 0,
          system,
          prompt,
          maxRetries: 0,
        });
        return { object, model };
      } catch (error) {
        lastError = error;
        const transient = isTransientScoringError(error);
        const willRetry = transient && attempt < ATTEMPTS_PER_MODEL - 1;
        const willFallback = transient && !willRetry && !isLastModel;

        logger.warn("Scoring attempt failed", {
          applicationId,
          model,
          attempt: attempt + 1,
          willRetry,
          willFallback,
          error: error instanceof Error ? error.message : error,
        });

        if (willRetry) {
          await sleep(backoffDelayMs(attempt));
          continue;
        }
        if (transient && !isLastModel) break;
        throw error;
      }
    }
  }

  throw lastError;
}

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
  retry: {
    maxAttempts: 1,
  },
  queue: {
    name: "ai-scoring",
    concurrencyLimit: 1,
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

      const { object, model } = await generateScoreObject(
        applicationId,
        system,
        prompt
      );

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
        model,
        matchScore: result.matchScore,
        eligible: result.eligible,
      });
      return {
        applicationId,
        model,
        matchScore: result.matchScore,
        eligible: result.eligible,
      };
    } catch (error) {
      logger.error("Scoring failed", { applicationId, error });
      await markScoreFailed(applicationId);
      throw error;
    }
  },
});
