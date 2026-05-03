import { FilterFn } from "@tanstack/react-table";

/**
 * TanStack Table FilterFn that matches a row when its column value appears
 * in the supplied filter array. Values are compared as strings to support
 * typed columns.
 */
export const arrayIncludesFilter: FilterFn<unknown> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true;
  }

  const cellValue = row.getValue(columnId);

  if (cellValue === null || cellValue === undefined) {
    return filterValue.includes("");
  }

  return filterValue.includes(String(cellValue));
};

arrayIncludesFilter.autoRemove = (val) =>
  !val || !Array.isArray(val) || val.length === 0;
