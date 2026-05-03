"use client";

import { ListFilter } from "lucide-react";
import React, { useState } from "react";

import { Button } from "../../../components/Button/Button";
import { Chip } from "../../../components/Chip/Chip";
import { type FilterOperatorKey, OPERATORS } from "../ast";
import styles from "./FilterBuilder.module.scss";
import type { FilterDraftCondition, FilterDraftGroup } from "./FilterGroup";
import { FilterSheetNested } from "./FilterSheetNested";

/**
 * Describes a column the user can filter on. Provides display metadata
 * (label, input type, select options) and optionally restricts which
 * operators apply.
 */
export interface FilterField {
  key: string;
  label: string;
  type: "select" | "text" | "number";
  options?: { value: string; label: string }[];
  operators?: FilterOperatorKey[];
}

export interface FilterBuilderProps {
  fields: FilterField[];
  value: FilterDraftGroup | null;
  onChange: (value: FilterDraftGroup) => void;
}

export function countConditions(group: FilterDraftGroup): number {
  return group.children.reduce((sum, child) => {
    if (child.type === "condition") {
      return sum + (child.field && child.value ? 1 : 0);
    }
    return sum + countConditions(child);
  }, 0);
}

export function flattenConditions(
  group: FilterDraftGroup,
): FilterDraftCondition[] {
  const result: FilterDraftCondition[] = [];
  for (const child of group.children) {
    if (child.type === "condition") {
      if (child.field && child.value) {
        result.push(child);
      }
    } else {
      result.push(...flattenConditions(child));
    }
  }
  return result;
}

export function FilterBuilder({ fields, value, onChange }: FilterBuilderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const conditions = value ? flattenConditions(value) : [];
  const conditionCount = value ? countConditions(value) : 0;

  const handleDismiss = (conditionId: string) => {
    if (!value) {
      return;
    }

    function removeById(group: FilterDraftGroup): FilterDraftGroup {
      return {
        ...group,
        children: group.children
          .filter((c) => c.id !== conditionId)
          .map((c) => (c.type === "group" ? removeById(c) : c)),
      };
    }

    onChange(removeById(value));
  };

  return (
    <div className={styles.filterBar}>
      {conditions.map((cond) => {
        const field = fields.find((f) => f.key === cond.field);
        const op = OPERATORS[cond.operator];
        return (
          <Chip
            key={cond.id}
            size="sm"
            onDismiss={() => handleDismiss(cond.id)}
          >
            {field?.label ?? cond.field} {op?.label ?? cond.operator}{" "}
            {cond.value}
          </Chip>
        );
      })}

      <Button size="sm" variant="ghost" onClick={() => setIsSheetOpen(true)}>
        <ListFilter size={14} />
        {conditionCount > 0 ? `Filters (${conditionCount})` : "Filters"}
      </Button>

      <FilterSheetNested
        fields={fields}
        initialValue={value}
        isOpen={isSheetOpen}
        onApply={onChange}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
}
