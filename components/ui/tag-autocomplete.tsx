"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import type { Key } from "@heroui/react";
import {
  Autocomplete,
  EmptyState,
  Header,
  ListBox,
  SearchField,
  Separator,
  Tag,
  TagGroup,
  useFilter,
} from "@heroui/react";
import type { SkillGroup } from "@/lib/profile/skill-groups";

type ValueRenderProps = {
  defaultChildren: ReactNode;
  isPlaceholder: boolean;
  state: { selectedItems: { key: Key }[] };
};

export function TagAutocomplete({
  value,
  groups,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  maxItems,
  onChange,
}: {
  value: string[];
  groups: readonly SkillGroup[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  maxItems: number;
  onChange: (value: string[]) => void;
}) {
  const { contains } = useFilter({ sensitivity: "base" });

  const onRemoveTags = (keys: Set<Key>) => {
    onChange(value.filter((key) => !keys.has(key)));
  };

  return (
    <Autocomplete<object, "multiple">
      selectionMode="multiple"
      value={value}
      onChange={(next) => onChange(next.map(String).slice(0, maxItems))}
      placeholder={placeholder}
      aria-label={placeholder}
      fullWidth
    >
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder, state }: ValueRenderProps) => {
            if (isPlaceholder || state.selectedItems.length === 0) {
              return defaultChildren;
            }
            return (
              <TagGroup size="sm" onRemove={onRemoveTags}>
                <TagGroup.List>
                  {state.selectedItems.map((item) => (
                    <Tag key={item.key} id={item.key}>
                      {String(item.key)}
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            );
          }}
        </Autocomplete.Value>
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains}>
          <SearchField fullWidth>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={searchPlaceholder} />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox
            renderEmptyState={() => <EmptyState>{emptyMessage}</EmptyState>}
          >
            {groups.map((group) => (
              <Fragment key={group.label}>
                <ListBox.Section>
                  <Header>{group.label}</Header>
                  {group.options.map((option) => (
                    <ListBox.Item key={option} id={option} textValue={option}>
                      {option}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox.Section>
                <Separator />
              </Fragment>
            ))}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}