import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import type { OptionGroup } from "@/components/ui/autocomplete-content";

export function JobMultipleAutocomplete({
  value,
  options,
  optionGroups,
  placeholder,
  searchPlaceholder,
  onChange,
}: {
  value: string[];
  options?: readonly string[];
  optionGroups?: readonly OptionGroup[];
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string[]) => void;
}) {
  return (
    <MultiAutocomplete
      value={value}
      options={options}
      optionGroups={optionGroups}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      onChange={onChange}
    />
  );
}