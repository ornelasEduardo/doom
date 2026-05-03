/**
 * The canonical filter representation. Tree of conditions and nested groups.
 * Treat as immutable — produce a new Filter rather than mutating in place.
 *
 * For the editable working version used by FilterBuilder UI, see FilterDraft.
 */
export type Filter = FilterCondition | FilterGroup;

export interface FilterCondition {
  readonly type: "condition";
  readonly id?: string;
  readonly field: string;
  readonly operator: FilterOperatorKey;
  readonly value: unknown;
  /** Joins this condition with the previous sibling. Defaults to "and" when omitted. */
  readonly logic?: "and" | "or";
}

export interface FilterGroup {
  readonly type: "group";
  readonly id?: string;
  readonly conditions: ReadonlyArray<Filter>;
  /** Joins this group with the previous sibling. Defaults to "and" when omitted. */
  readonly logic?: "and" | "or";
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
