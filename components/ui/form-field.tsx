import type { ReactNode } from "react";
import { Label } from "@heroui/react";

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
        className="text-sm font-medium text-zinc-900"
      >
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="field-error" data-visible aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
