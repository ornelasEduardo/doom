"use client";

import { Column } from "@tanstack/react-table";
import { Filter } from "lucide-react";
import React, { useMemo, useState } from "react";

import { Button } from "../Button/Button";
import { Combobox } from "../Combobox/Combobox";
import { Popover } from "../Popover/Popover";
import styles from "./TableHeaderFilter.module.scss";

interface TableHeaderFilterProps<T> {
  column: Column<T, unknown>;
  options?: { value: string; label: string }[];
}

function useFilterOptions<T>(
  column: Column<T, unknown>,
  itemOptions?: { value: string; label: string }[],
) {
  const [isOpen, setIsOpen] = useState(false);

  const filterValue = column.getFilterValue();

  const selectedValues = useMemo(() => {
    if (!filterValue) {
      return [];
    }
    if (Array.isArray(filterValue)) {
      return (filterValue as any[]).map(String);
    }
    return [String(filterValue)];
  }, [filterValue]);

  const { filterOptions, valueMap } = useMemo(() => {
    if (itemOptions) {
      return { filterOptions: itemOptions, valueMap: null };
    }

    const uniqueValues = new Map<string, any>();
    const facetedValues = column.getFacetedUniqueValues();
    facetedValues.forEach((_, value) => {
      if (value !== null && value !== undefined) {
        uniqueValues.set(String(value), value);
      }
    });

    const generatedOptions = Array.from(uniqueValues.keys())
      .sort()
      .map((value) => ({ value, label: value }));

    return { filterOptions: generatedOptions, valueMap: uniqueValues };
  }, [column, itemOptions]);

  const [sortedOptions, setSortedOptions] = useState(filterOptions);

  React.useEffect(() => {
    if (isOpen) {
      setSortedOptions((_prev) => {
        const next = [...filterOptions];
        return next.sort((a, b) => {
          const aSelected = selectedValues.includes(a.value);
          const bSelected = selectedValues.includes(b.value);

          if (aSelected && !bSelected) {
            return -1;
          }
          if (!aSelected && bSelected) {
            return 1;
          }
          return a.label.localeCompare(b.label);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return {
    sortedOptions,
    selectedValues,
    valueMap,
    isOpen,
    setIsOpen,
    filterValue,
  };
}

export function TableHeaderFilter<T>({
  column,
  options,
}: TableHeaderFilterProps<T>) {
  const {
    sortedOptions,
    selectedValues,
    valueMap,
    isOpen,
    setIsOpen,
    filterValue,
  } = useFilterOptions(column, options);

  const hasActiveFilter =
    filterValue !== undefined &&
    filterValue !== "" &&
    (Array.isArray(filterValue) ? filterValue.length > 0 : true);

  const handleChange = (value: string | string[] | undefined) => {
    let finalValue: any = value;
    if (valueMap && value) {
      if (Array.isArray(value)) {
        finalValue = value.map((v) => valueMap.get(v));
      } else {
        finalValue = valueMap.get(value);
      }
    }

    column.setFilterValue(finalValue);
  };

  return (
    <Popover
      content={
        <Combobox
          inline
          multiple
          options={sortedOptions}
          placeholder="Filter..."
          searchable={sortedOptions.length > 5}
          size="sm"
          value={selectedValues}
          onChange={handleChange}
        />
      }
      isOpen={isOpen}
      placement="bottom-start"
      trigger={
        <Button
          aria-label={`Filter by ${String(column.columnDef.header)}`}
          size="sm"
          variant={hasActiveFilter ? "primary" : "ghost"}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <Filter size={16} strokeWidth={2.5} />
          {selectedValues.length > 0 && (
            <span className={styles.filterCount}>
              ({selectedValues.length})
            </span>
          )}
        </Button>
      }
      onClose={() => setIsOpen(false)}
    />
  );
}
