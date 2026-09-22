type ApplicantScore = {
  matchScore: number | null;
  status: "PENDING" | "COMPLETE" | "FAILED";
} | null;

type RankableApplicant = {
  createdAt: Date;
  score: ApplicantScore;
};

function completedScore(score: ApplicantScore) {
  return score?.status === "COMPLETE" && score.matchScore !== null
    ? score.matchScore
    : null;
}

export function rankApplicantsByScore<T extends RankableApplicant>(
  applications: readonly T[]
) {
  return [...applications].sort((left, right) => {
    const leftScore = completedScore(left.score);
    const rightScore = completedScore(right.score);

    if (leftScore !== null && rightScore !== null && leftScore !== rightScore) {
      return rightScore - leftScore;
    }
    if (leftScore !== null && rightScore === null) return -1;
    if (leftScore === null && rightScore !== null) return 1;
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}
