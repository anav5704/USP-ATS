import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";

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
    <MultiAutocomplete
      value={value}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      onChange={onChange}
    />
  );
}