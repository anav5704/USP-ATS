import { Autocomplete } from "@heroui/react";
import {
  AutocompleteContent,
  type OptionGroup,
} from "@/components/ui/autocomplete-content";

export function JobSingleAutocomplete({
  value,
  options,
  optionGroups,
  placeholder,
  searchPlaceholder,
  onChange,
  isDisabled = false,
}: {
  value: string;
  options?: readonly string[];
  optionGroups?: readonly OptionGroup[];
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
}) {
  return (
    <Autocomplete<object, "single">
      selectionMode="single"
      isDisabled={isDisabled}
      value={value || null}
      onChange={(next) => onChange(next === null ? "" : String(next))}
      placeholder={placeholder}
      aria-label={placeholder}
      fullWidth
    >
      <AutocompleteContent
        options={options}
        optionGroups={optionGroups}
        searchPlaceholder={searchPlaceholder}
      />
    </Autocomplete>
  );
}
