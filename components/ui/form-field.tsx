import type { ReactNode } from "react";
import { Label } from "@heroui/react";

export function FormField({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p className="field-error" data-visible aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
