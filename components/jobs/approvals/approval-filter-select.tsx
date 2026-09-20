"use client";

import { useId } from "react";
import { ListBox, Select } from "@heroui/react";

export type ApprovalFilterOption = {
  value: string;
  label: string;
};

const ALL_VALUE = "__all__";

export function ApprovalFilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: readonly ApprovalFilterOption[];
  onChange: (value: string) => void;
}) {
  const labelId = useId();

  return (
    <div className="space-y-1.5">
      <span
        id={labelId}
        className="text-xs font-semibold uppercase tracking-wide text-muted"
      >
        {label}
      </span>
      <Select.Root
        fullWidth
        aria-labelledby={labelId}
        selectedKey={value || ALL_VALUE}
        onSelectionChange={(key) =>
          onChange(key === ALL_VALUE ? "" : String(key))
        }
      >
        <Select.Trigger className="border-border">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover placement="bottom start" className="max-h-64">
          <ListBox.Root>
            <ListBox.Item id={ALL_VALUE} textValue={allLabel}>
              {allLabel}
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {options.map((option) => (
              <ListBox.Item
                key={option.value}
                id={option.value}
                textValue={option.label}
              >
                {option.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox.Root>
        </Select.Popover>
      </Select.Root>
    </div>
  );
}
