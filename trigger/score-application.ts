import { logger, task } from "@trigger.dev/sdk";

export const scoreApplication = task({
  id: "score-application",
  retry: {
    maxAttempts: 3,
  },
  run: async (applicationId: string) => {
    logger.info("Scoring task shell triggered", { applicationId });

    // 1. Load the application by id, including the job posting requirements
    //    (gpaMin, degree, skills, jobType) and the student's profile snapshot
    //    (skills, degrees, certificates, bio) plus the cover letter.

    // 2. Assemble the scoring inputs: job requirements, applicant profile, cover letter.

    // 3. Call Gemini (gemini-3.5-flash) via the Vercel AI SDK (https://ai-sdk.dev/providers/ai-sdk-providers/google)
    //  `generateObject` with a Zod schema for: matchScore, eligible, qualificationFit, motivationFit, missingRequirements.

    // 4. Upsert the ScoreResult for this application with status COMPLETE and the outputs.

    // 5. On failure, mark the ScoreResult as FAILED (trigger.dev handles retries).

    return { applicationId };
  },
});
