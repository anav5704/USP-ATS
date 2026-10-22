import { Button } from "@heroui/react";
import {
  CircleAlertIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import type { AdminApplicantListItem } from "@/lib/applications/application-schema";

export function ApplicationScoreCell({
  score,
  onRescore,
  isRescoring = false,
}: {
  score: AdminApplicantListItem["score"];
  onRescore?: () => void;
  isRescoring?: boolean;
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
      <span className="inline-flex items-center gap-2 text-xs text-danger">
        <IconTooltip label="AI scoring failed for this application. Use Re-score to try again">
          <span className="inline-flex items-center gap-1.5">
            <CircleAlertIcon className="size-3.5" /> Failed
          </span>
        </IconTooltip>
        {onRescore ? (
          <Button.Root
            size="sm"
            variant="ghost"
            isDisabled={isRescoring}
            onPress={onRescore}
            className="text-xs text-muted hover:text-foreground"
          >
            {isRescoring ? (
              <LoaderCircleIcon className="size-3.5 animate-spin" />
            ) : (
              <RefreshCwIcon className="size-3.5" />
            )}
            Re-score
          </Button.Root>
        ) : null}
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
