export type FilterNode = FilterCondition | FilterGroup;

interface BaseFilterNode {
  id?: string;
  logic?: "and" | "or";
}

export interface FilterCondition extends BaseFilterNode {
  type: "condition";
  field: string;
  operator: FilterOperatorKey;
  value: unknown;
}

export interface FilterGroup extends BaseFilterNode {
  type: "group";
  conditions: FilterNode[]; // Children
}

export type FilterOperatorKey =
  | "eq"
  | "neq"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "isEmpty"
  | "isNotEmpty";

export interface FilterOperatorDef {
  key: FilterOperatorKey;
  label: string;
  fn: (cellValue: unknown, filterValue: unknown) => boolean;
}

export const OPERATORS: Record<FilterOperatorKey, FilterOperatorDef> = {
  eq: {
    key: "eq",
    label: "equals",
    fn: (a, b) => a === b,
  },
  neq: {
    key: "neq",
    label: "not equals",
    fn: (a, b) => a !== b,
  },
  contains: {
    key: "contains",
    label: "contains",
    fn: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
  },
  startsWith: {
    key: "startsWith",
    label: "starts with",
    fn: (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase()),
  },
  endsWith: {
    key: "endsWith",
    label: "ends with",
    fn: (a, b) => String(a).toLowerCase().endsWith(String(b).toLowerCase()),
  },
  gt: {
    key: "gt",
    label: "greater than",
    fn: (a, b) => Number(a) > Number(b),
  },
  gte: {
    key: "gte",
    label: "greater or equal",
    fn: (a, b) => Number(a) >= Number(b),
  },
  lt: {
    key: "lt",
    label: "less than",
    fn: (a, b) => Number(a) < Number(b),
  },
  lte: {
    key: "lte",
    label: "less or equal",
    fn: (a, b) => Number(a) <= Number(b),
  },
  in: {
    key: "in",
    label: "is one of",
    fn: (a, b) => Array.isArray(b) && b.includes(a),
  },
  notIn: {
    key: "notIn",
    label: "is not one of",
    fn: (a, b) => Array.isArray(b) && !b.includes(a),
  },
  isEmpty: {
    key: "isEmpty",
    label: "is empty",
    fn: (a) => a == null || a === "",
  },
  isNotEmpty: {
    key: "isNotEmpty",
    label: "is not empty",
    fn: (a) => a != null && a !== "",
  },
};

export function evaluateFilter(
  node: FilterNode,
  row: Record<string, unknown>,
): boolean {
  if (node.type === "condition") {
    const { field, operator, value } = node;
    const cellValue = row[field];
    const operatorDef = OPERATORS[operator];

    if (!operatorDef) {
      console.warn(`Unknown operator: ${operator}`);
      return true;
    }

    return operatorDef.fn(cellValue, value);
  }

  if (node.type === "group") {
    const { conditions } = node;

    if (!conditions || conditions.length === 0) {
      return true;
    }

    let accumulatedResult = evaluateFilter(conditions[0], row);

    for (let i = 1; i < conditions.length; i++) {
      const current = conditions[i];
      const result = evaluateFilter(current, row);

      if (current.logic === "or") {
        accumulatedResult = accumulatedResult || result;
      } else {
        accumulatedResult = accumulatedResult && result;
      }
    }

    return accumulatedResult;
  }

  return true;
}

export interface SimpleFilter {
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

export function simpleFiltersToAST(
  selections: Record<string, string>,
): FilterNode | null {
  const conditions: FilterCondition[] = Object.entries(selections)
    .filter(([, value]) => value !== "" && value != null)
    .map(([field, value], index) => ({
      type: "condition" as const,
      field,
      operator: "eq" as const,
      value,
      logic: index > 0 ? ("and" as const) : undefined,
    }));

  if (conditions.length === 0) {
    return null;
  }
  if (conditions.length === 1) {
    return conditions[0];
  }

  return {
    type: "group",
    conditions,
  };
}
