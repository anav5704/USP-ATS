import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { PlusIcon } from "lucide-react";

export function RepeaterSection({
  icon: Icon,
  title,
  description,
  addLabel,
  onAdd,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>
        </div>
        <Button.Root
          type="button"
          size="sm"
          variant="ghost"
          onPress={onAdd}
          className="shrink-0 text-zinc-600 dark:text-zinc-300"
        >
          <PlusIcon className="size-4" />
          {addLabel}
        </Button.Root>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
