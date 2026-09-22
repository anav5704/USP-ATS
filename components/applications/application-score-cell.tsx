import { CircleAlertIcon, LoaderCircleIcon } from "lucide-react";
import type { AdminApplicantListItem } from "@/lib/applications/application-schema";

export function ApplicationScoreCell({
  score,
}: {
  score: AdminApplicantListItem["score"];
}) {
  if (score === null) {
    return <span className="text-muted">-</span>;
  }

  if (score.status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <LoaderCircleIcon className="size-3.5 animate-spin" /> Scoring...
      </span>
    );
  }

  if (score.status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger">
        <CircleAlertIcon className="size-3.5" /> Failed
      </span>
    );
  }

  if (score.matchScore === null) {
    return <span className="text-muted">-</span>;
  }

  return (
    <span className="inline-flex items-baseline gap-1 font-medium text-foreground">
      {score.matchScore}
      <span className="text-xs text-muted">/100</span>
    </span>
  );
}
