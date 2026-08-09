import { Autocomplete } from "@heroui/react";
import { AutocompleteContent } from "@/components/ui/autocomplete-content";

export function JobSingleAutocomplete({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onChange,
}: {
  value: string;
  options: readonly string[];
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Autocomplete<object, "single">
      selectionMode="single"
      value={value || null}
      onChange={(next) => onChange(next === null ? "" : String(next))}
      placeholder={placeholder}
      aria-label={placeholder}
      fullWidth
    >
      <AutocompleteContent
        options={options}
        searchPlaceholder={searchPlaceholder}
      />
    </Autocomplete>
  );
}