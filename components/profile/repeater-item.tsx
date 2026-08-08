import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Trash2Icon } from "lucide-react";

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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {index > 0 ? `${title} ${index + 1}` : title}
        </p>
        {canRemove ? (
          <Button.Root
            type="button"
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Remove ${title.toLowerCase()}`}
            onPress={onRemove}
            className="text-zinc-500 transition-colors hover:text-red-500"
          >
            <Trash2Icon className="size-4" />
          </Button.Root>
        ) : null}
      </div>
      {children}
    </div>
  );
}
