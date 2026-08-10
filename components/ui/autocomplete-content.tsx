"use client";

import { Fragment } from "react";
import {
  Autocomplete,
  Header,
  ListBox,
  SearchField,
  Separator,
  useFilter,
} from "@heroui/react";

export type OptionGroup = {
  label: string;
  options: readonly string[];
};

export function AutocompleteContent({
  options,
  optionGroups,
  searchPlaceholder,
}: {
  options?: readonly string[];
  optionGroups?: readonly OptionGroup[];
  searchPlaceholder: string;
}) {
  const { contains } = useFilter({ sensitivity: "base" });

  return (
    <>
      <Autocomplete.Trigger>
        <Autocomplete.Value />
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
          <ListBox>
            {optionGroups
              ? optionGroups.map((group) => (
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
                ))
              : options?.map((option) => (
                  <ListBox.Item key={option} id={option} textValue={option}>
                    {option}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </>
  );
}