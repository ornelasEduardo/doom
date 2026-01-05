"use client";

import { Trash2 } from "lucide-react";
import React from "react";

import { Button } from "../../Button/Button";
import { Input } from "../../Input/Input";
import { Select } from "../../Select/Select";
import type { FilterOperatorKey } from "../utils/filterAst";
import { OPERATORS } from "../utils/filterAst";
import type { FilterField } from "./FilterBuilder";
import styles from "./FilterConditionRow.module.scss";

export interface FilterConditionData {
  id: string;
  field: string;
  operator: FilterOperatorKey;
  value: string;
}

interface FilterConditionRowProps {
  condition: FilterConditionData;
  fields: FilterField[];
  onChange: (updated: FilterConditionData) => void;
  onRemove: () => void;
}

export function FilterConditionRow({
  condition,
  fields,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const selectedField = fields.find((f) => f.key === condition.field);
  const availableOperators = selectedField?.operators ?? [
    "eq",
    "neq",
    "contains",
  ];

  const handleFieldChange = (value: string) => {
    onChange({
      ...condition,
      field: value,
      operator: "eq",
      value: "",
    });
  };

  const handleOperatorChange = (value: string) => {
    onChange({
      ...condition,
      operator: value as FilterOperatorKey,
    });
  };

  const handleValueChange = (value: string) => {
    onChange({
      ...condition,
      value,
    });
  };

  return (
    <div className={styles.row}>
      <Select
        className={styles.fieldSelect}
        options={fields.map((f) => ({ value: f.key, label: f.label }))}
        placeholder="Field..."
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value as string)}
      />
      <Select
        className={styles.operatorSelect}
        options={availableOperators.map((op) => ({
          value: op,
          label: OPERATORS[op].label,
        }))}
        value={condition.operator}
        onChange={(e) => handleOperatorChange(e.target.value as string)}
      />
      {selectedField?.type === "select" && selectedField.options ? (
        <Select
          className={styles.valueSelect}
          options={selectedField.options}
          placeholder="Value..."
          value={condition.value}
          onChange={(e) => handleValueChange(e.target.value as string)}
        />
      ) : (
        <Input
          className={styles.valueInput}
          placeholder="Value..."
          value={condition.value}
          onChange={(e) => handleValueChange(e.target.value)}
        />
      )}
      <Button
        aria-label="Remove condition"
        size="sm"
        variant="ghost"
        onClick={onRemove}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
