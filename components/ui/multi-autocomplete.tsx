"use client";

import { Autocomplete } from "@heroui/react";
import { AutocompleteContent } from "@/components/ui/autocomplete-content";

export function MultiAutocomplete({
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
      <AutocompleteContent
        options={options}
        searchPlaceholder={searchPlaceholder}
      />
    </Autocomplete>
  );
}