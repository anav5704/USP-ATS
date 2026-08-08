import Link from "next/link";
import { Card } from "@heroui/react";

type LucideIcon = React.ComponentType<{ className?: string }>;

export function QuickLink({
  href,
  icon: IconComp,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="block rounded-2xl focus-visible:outline-none">
      <Card.Root className="h-full rounded-2xl bg-white p-5 transition-colors hover:bg-zinc-50">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
            <IconComp className="size-5" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-900">
            {title}
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </Card.Root>
    </Link>
  );
}
