// AST (headless) — pure data layer, no React
export type {
  Filter,
  FilterCondition,
  FilterGroup,
  FilterOperatorKey,
} from "./ast";
export {
  arrayIncludesFilter,
  evaluateFilter,
  type FilterOperatorDef,
  OPERATORS,
  simpleFiltersToFilter,
} from "./ast";

// UI (presentational) — doom-styled FilterBuilder components
export { draftToFilter, filterToDraft } from "./ui/convert";
export {
  countConditions,
  FilterBuilder,
  type FilterBuilderProps,
  type FilterField,
  flattenConditions,
} from "./ui/FilterBuilder";
export {
  type FilterConditionData,
  FilterConditionRow,
} from "./ui/FilterConditionRow";
export {
  ConditionRow,
  type FilterDraft,
  type FilterDraftCondition,
  type FilterDraftGroup,
  FilterGroup as FilterGroupView,
} from "./ui/FilterGroup";
export { FilterSheetNested } from "./ui/FilterSheetNested";
