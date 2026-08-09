import { Calendar, DateField, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { FormField } from "@/components/ui/form-field";
import { todayInFiji } from "@/lib/jobs/job-dates";

function parseValue(value: string) {
  try {
    return value ? parseDate(value) : null;
  } catch {
    return null;
  }
}

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
    <FormField label="Application deadline" error={error}>
      <DatePicker
        aria-label="Application deadline"
        value={parseValue(value)}
        minValue={minimumDate}
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
          <Calendar aria-label="Choose application deadline" minValue={minimumDate}>
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
