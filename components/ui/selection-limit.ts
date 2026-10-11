export type SelectionLimitResult = {
  value: string[];
  limitReached: boolean;
};

// Selecting past `maxItems` keeps the selection valid rather than growing it,
// and reports the overflow so the caller can tell the user instead of
// silently discarding their choice.
export function applySelectionLimit(
  selection: readonly string[],
  maxItems: number
): SelectionLimitResult {
  const value = selection.map(String);
  return {
    value: value.slice(0, maxItems),
    limitReached: value.length > maxItems,
  };
}
