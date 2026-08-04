import type { ReactNode } from "react";
import { FieldError, Label } from "@heroui/react";

export function FormField({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
