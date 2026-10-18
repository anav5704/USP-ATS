import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Trash2Icon } from "lucide-react";
import { IconTooltip } from "@/components/ui/icon-tooltip";

export function RepeaterItem({
  title,
  index,
  canRemove = true,
  onRemove,
  children,
}: {
  title: string;
  index: number;
  canRemove?: boolean;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {index > 0 ? `${title} ${index + 1}` : title}
        </p>
        {canRemove ? (
          <IconTooltip label={`Remove ${title.toLowerCase()}`}>
            <Button.Root
              type="button"
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Remove ${title.toLowerCase()}`}
              onPress={onRemove}
              className="text-muted transition-colors hover:text-danger"
            >
              <Trash2Icon className="size-4" />
            </Button.Root>
          </IconTooltip>
        ) : null}
      </div>
      {children}
    </div>
  );
}
