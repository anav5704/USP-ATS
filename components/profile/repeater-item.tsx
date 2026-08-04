import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Trash2Icon } from "lucide-react";

export function RepeaterItem({
  title,
  index,
  canRemove,
  onRemove,
  children,
}: {
  title: string;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {index > 0 ? `${title} ${index + 1}` : title}
        </p>
        {canRemove ? (
          <Button.Root
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Remove ${title.toLowerCase()}`}
            onPress={onRemove}
            className="text-zinc-500 transition-colors hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400"
          >
            <Trash2Icon className="size-4" />
          </Button.Root>
        ) : null}
      </div>
      {children}
    </div>
  );
}
