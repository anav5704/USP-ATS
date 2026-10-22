import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { PlusIcon } from "lucide-react";

export function RepeaterSection({
  icon: Icon,
  title,
  addLabel,
  onAdd,
  fill = false,
  fixed = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  addLabel: string;
  onAdd: () => void;
  fill?: boolean;
  fixed?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-border bg-surface p-4 sm:p-5 ${
        fill ? "min-h-0 flex-1" : fixed ? "h-[60vh]" : "max-h-[60vh]"
      }`}
    >
      <div className="mb-4 flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-foreground">
            <Icon className="size-5" />
          </span>
          <h2 className="text-xl font-semibold text-foreground">
            {title}
          </h2>
        </div>
        <Button.Root
          type="button"
          size="sm"
          variant="ghost"
          onPress={onAdd}
          className="w-full shrink-0 text-muted sm:w-auto"
        >
          <PlusIcon className="size-4" />
          {addLabel}
        </Button.Root>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">{children}</div>
    </section>
  );
}
