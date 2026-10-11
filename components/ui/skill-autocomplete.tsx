"use client";

import { useState } from "react";
import { Autocomplete } from "@heroui/react";
import {
  AutocompleteContent,
  type OptionGroup,
} from "@/components/ui/autocomplete-content";
import { applySelectionLimit } from "@/components/ui/selection-limit";

export function SkillAutocomplete({
  value,
  groups,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  maxItems,
  limitMessage,
  onChange,
}: {
  value: string[];
  groups: readonly OptionGroup[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  maxItems: number;
  limitMessage?: string;
  onChange: (value: string[]) => void;
}) {
  const [showLimit, setShowLimit] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <Autocomplete<object, "multiple">
        selectionMode="multiple"
        value={value}
        onChange={(next) => {
          const result = applySelectionLimit(next.map(String), maxItems);
          setShowLimit(result.limitReached);
          onChange(result.value);
        }}
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
      {showLimit && limitMessage ? (
        <p className="text-xs text-danger">{limitMessage}</p>
      ) : null}
    </div>
  );
}