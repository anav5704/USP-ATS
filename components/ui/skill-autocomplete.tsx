"use client";

import { Autocomplete } from "@heroui/react";
import {
  AutocompleteContent,
  type OptionGroup,
} from "@/components/ui/autocomplete-content";

export function SkillAutocomplete({
  value,
  groups,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  maxItems,
  onChange,
}: {
  value: string[];
  groups: readonly OptionGroup[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  maxItems: number;
  onChange: (value: string[]) => void;
}) {
  return (
    <Autocomplete<object, "multiple">
      selectionMode="multiple"
      value={value}
      onChange={(next) => onChange(next.map(String).slice(0, maxItems))}
      placeholder={placeholder}
      aria-label={placeholder}
      fullWidth
    >
      <AutocompleteContent
        optionGroups={groups}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
      />
    </Autocomplete>
  );
}
