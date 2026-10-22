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
    <div className={`${className} min-w-0`}>
      <Label
        htmlFor={id}
        className="break-words text-sm font-medium text-foreground"
      >
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="break-words text-xs text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="field-error break-words" data-visible aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
