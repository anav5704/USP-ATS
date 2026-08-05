import { MailIcon, UserRoundIcon } from "lucide-react";

export function AccountInfoStrip({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
          <UserRoundIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {name}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            <MailIcon className="size-3.5 shrink-0" />
            <span className="truncate">{email}</span>
          </p>
        </div>
      </div>
      <p className="mt-3 border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Name and email come from your Microsoft account and cannot be edited here.
      </p>
    </section>
  );
}
