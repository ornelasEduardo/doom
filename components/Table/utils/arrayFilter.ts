import { FilterFn } from "@tanstack/react-table";

/**
 * Custom filter function for array-based column filters.
 * When filterValue is an array, row passes if its value is in the array.
 * Handles typed data by converting values to strings for comparison.
 */
export const arrayIncludesFilter: FilterFn<unknown> = (
  row,
  columnId,
  filterValue,
  _addMeta,
) => {
  // No filter = show all
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }

  const cellValue = row.getValue(columnId);

  // Handle null/undefined
  if (cellValue === null || cellValue === undefined) {
    return filterValue.includes("");
  }

  // Convert to string for comparison (supports typed data)
  const stringValue = String(cellValue);
  return filterValue.includes(stringValue);
};

// Make filter function auto-removable when value is empty array
arrayIncludesFilter.autoRemove = (val) =>
  !val || !Array.isArray(val) || val.length === 0;
