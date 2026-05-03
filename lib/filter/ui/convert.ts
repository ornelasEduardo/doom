import type { Filter, FilterCondition, FilterGroup } from "../ast";
import type {
  FilterDraft,
  FilterDraftCondition,
  FilterDraftGroup,
} from "./FilterGroup";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

/**
 * Converts an editable FilterDraft (UI working state) into the canonical
 * immutable Filter (evaluation-ready). Strips UI-only fields like
 * `collapsed` and converts `children[]` to `conditions[]`.
 */
export function draftToFilter(draft: FilterDraft): Filter {
  if (draft.type === "group") {
    return {
      type: "group",
      id: draft.id,
      logic: draft.logic,
      conditions: draft.children.map(draftToFilter),
    };
  }
  return {
    type: "condition",
    id: draft.id,
    field: draft.field,
    operator: draft.operator,
    value: draft.value,
    logic: draft.logic,
  };
}

/**
 * Converts a canonical Filter into an editable FilterDraft. Generates IDs
 * for any node missing one (the AST treats id as optional, the draft
 * requires it for React keys and dnd identifiers).
 */
export function filterToDraft(filter: Filter): FilterDraft {
  if (filter.type === "group") {
    return {
      type: "group",
      id: filter.id ?? nextId("group"),
      logic: filter.logic,
      children: filter.conditions.map(filterToDraft),
    };
  }
  return {
    type: "condition",
    id: filter.id ?? nextId("cond"),
    field: filter.field,
    operator: filter.operator,
    value: filter.value == null ? "" : String(filter.value),
    logic: filter.logic,
  };
}

// Internal helpers re-exported so existing Table imports keep working.
// These accept FilterCondition/FilterGroup explicitly.
export function conditionDraftToFilter(
  draft: FilterDraftCondition,
): FilterCondition {
  return draftToFilter(draft) as FilterCondition;
}

export function groupDraftToFilter(draft: FilterDraftGroup): FilterGroup {
  return draftToFilter(draft) as FilterGroup;
}
