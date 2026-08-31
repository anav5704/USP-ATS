"use client";

import { parseDate } from "@internationalized/date";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { todayInFiji } from "@/lib/jobs/job-dates";

export function JobDeadlineField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const minimumDate = parseDate(todayInFiji());

  return (
    <DatePickerField
      label="Application deadline"
      value={value}
      error={error}
      onChange={onChange}
      minValue={minimumDate}
    />
  );
}