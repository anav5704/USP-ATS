"use client";

import { Calendar, DateField, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import { FormField } from "@/components/ui/form-field";

function parseValue(value: string) {
  try {
    return value ? parseDate(value) : null;
  } catch {
    return null;
  }
}

export function DatePickerField({
  label,
  id,
  value,
  onChange,
  error,
  minValue,
  fieldClassName,
}: {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  minValue?: CalendarDate;
  fieldClassName?: string;
}) {
  return (
    <FormField label={label} id={id} error={error} className={fieldClassName}>
      <DatePicker
        aria-label={label}
        className="w-full"
        value={parseValue(value)}
        minValue={minValue}
        onChange={(date) => onChange(date?.toString() ?? "")}
      >
        <DateField.Group fullWidth>
          <DateField.Input>
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover>
          <Calendar aria-label={`Choose ${label.toLowerCase()}`} minValue={minValue}>
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => (
                  <Calendar.Cell date={date}>
                    {date.day}
                    <Calendar.CellIndicator />
                  </Calendar.Cell>
                )}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
    </FormField>
  );
}
