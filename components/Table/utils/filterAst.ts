/**
 * Re-export shim. The canonical home for filter AST types and helpers is
 * lib/filter/ast. Existing Table internals import through this path during
 * the migration; new code should import from "doom-design-system/filter".
 */
export {
  evaluateFilter,
  type Filter,
  type FilterCondition,
  type FilterGroup,
  type Filter as FilterNode,
  type FilterOperatorDef,
  type FilterOperatorKey,
  OPERATORS,
  simpleFiltersToFilter as simpleFiltersToAST,
} from "../../../lib/filter/ast";
