import { Autocomplete } from "@heroui/react";
import { JobAutocompleteContent } from "@/components/jobs/job-autocomplete-content";

export function JobMultipleAutocomplete({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onChange,
}: {
  value: string[];
  options: readonly string[];
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string[]) => void;
}) {
  return (
    <Autocomplete<object, "multiple">
      selectionMode="multiple"
      value={value}
      onChange={(next) => onChange(next.map(String))}
      placeholder={placeholder}
      aria-label={placeholder}
      fullWidth
    >
      <JobAutocompleteContent
        options={options}
        searchPlaceholder={searchPlaceholder}
      />
    </Autocomplete>
  );
}
