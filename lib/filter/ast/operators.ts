import { FilterOperatorKey } from "./types";

export interface FilterOperatorDef {
  readonly key: FilterOperatorKey;
  readonly label: string;
  readonly fn: (cellValue: unknown, filterValue: unknown) => boolean;
}

export const OPERATORS: Readonly<Record<FilterOperatorKey, FilterOperatorDef>> =
  {
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
