"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Input } from "@heroui/react";
import { FormField } from "@/components/ui/form-field";
import type { ProfileInput } from "@/lib/profile/profile-schema";
import { acceptsNationalInput, canonicalPhone, phoneEditorState, phoneLengthMessage } from "@/lib/profile/phone";

export function PhoneField() {
  const { control, formState: { errors } } = useFormContext<ProfileInput>();
  const campuses = useWatch({ control, name: "campuses" }) ?? [];
  const phone = useWatch({ control, name: "phone" }) ?? "";
  // Scope rejected-input feedback to the current value and campus selection.
  const [rejected, setRejected] = useState<string>();
  const state = phoneEditorState(phone, campuses);
  const rejectionKey = JSON.stringify([phone, campuses]);
  const error = rejected === rejectionKey
    ? "Phone number can contain digits only."
    : state.error ?? errors.phone?.message;
  const hint = state.plan ? phoneLengthMessage(state.plan) : "Select your Campus/Centre first.";

  return (
    <FormField id="phone" label="Phone number (optional)" error={error}>
      <div className="flex min-w-0 items-center gap-2">
        {state.plan && (
          <span id="phone-prefix" className="shrink-0 rounded-field border border-border bg-surface-secondary px-3 py-2 text-sm text-foreground">
            <span className="sr-only">{state.plan.country} country calling code (locked): </span>
            {state.plan.callingCode}
          </span>
        )}
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input.Root
              id="phone"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="[0-9]*"
              disabled={state.disabled}
              maxLength={state.maxLength}
              fullWidth
              className="min-w-0 flex-1"
              aria-describedby={`phone-help${state.plan ? " phone-prefix" : ""}${error ? " phone-error" : ""}${state.legacyValue ? " phone-legacy" : ""}`}
              aria-invalid={!!error}
              value={state.national}
              onChange={(event) => {
                const national = event.target.value;
                if (!state.plan) return;
                if (!/^[0-9]*$/.test(national)) {
                  setRejected(rejectionKey);
                  return;
                }
                setRejected(undefined);
                if (acceptsNationalInput(national, state.maxLength!)) {
                  field.onChange(canonicalPhone(national, state.plan));
                }
              }}
            />
          )}
        />
      </div>
      <p id="phone-help" className="break-words text-xs text-muted">{hint}</p>
      {state.legacyValue && (
        <p id="phone-legacy" className="break-all text-xs text-muted">
          Stored phone: {state.legacyValue}. Enter a valid number for your Campus/Centre to replace it before saving.
        </p>
      )}
    </FormField>
  );
}
