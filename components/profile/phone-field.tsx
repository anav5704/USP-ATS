"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { InputGroup } from "@heroui/react";
import { FormField } from "@/components/ui/form-field";
import { InfoPopover } from "@/components/ui/info-popover";
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
      <InputGroup.Root fullWidth>
        {state.plan && (
          <InputGroup.Prefix className="me-3 text-sm text-foreground">
            <span id="phone-prefix" className="sr-only">
              {state.plan.country} country calling code (locked):
            </span>
            {state.plan.callingCode}
          </InputGroup.Prefix>
        )}
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <InputGroup.Input
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
        <InputGroup.Suffix className="pr-1.5">
          <InfoPopover
            title={state.plan ? `Phone number format: ${state.plan.country}` : "Phone number"}
            body={hint}
          />
        </InputGroup.Suffix>
      </InputGroup.Root>
      <p id="phone-help" className="sr-only">{hint}</p>
      {state.legacyValue && (
        <p id="phone-legacy" className="break-all text-xs text-muted">
          Stored phone: {state.legacyValue}. Enter a valid number for your Campus/Centre to replace it before saving.
        </p>
      )}
    </FormField>
  );
}
