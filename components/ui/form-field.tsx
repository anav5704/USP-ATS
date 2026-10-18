import type { ReactNode } from "react";
import { Label } from "@heroui/react";

export function FormField({
  label,
  id,
  error,
  hint,
  className = "space-y-1.5",
  children,
}: {
  label: string;
  id?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p className="field-error" data-visible aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
