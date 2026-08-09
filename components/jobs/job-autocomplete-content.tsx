import {
  Autocomplete,
  ListBox,
  SearchField,
  useFilter,
} from "@heroui/react";

export function JobAutocompleteContent({
  options,
  searchPlaceholder,
}: {
  options: readonly string[];
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
            {options.map((option) => (
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
