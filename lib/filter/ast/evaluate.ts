import { OPERATORS } from "./operators";
import { Filter } from "./types";

/**
 * Recursively evaluates a Filter against a row of data.
 * Returns true if the row matches the filter expression.
 */
export function evaluateFilter(
  filter: Filter,
  row: Record<string, unknown>,
): boolean {
  if (filter.type === "condition") {
    const { field, operator, value } = filter;
    const cellValue = row[field];
    const operatorDef = OPERATORS[operator];

    if (!operatorDef) {
      console.warn(`Unknown operator: ${operator}`);
      return true;
    }

    return operatorDef.fn(cellValue, value);
  }

  // Group: short-circuit on empty, otherwise fold conditions left-to-right
  // respecting each child's `logic` (and | or). Implicit "and" when omitted.
  const { conditions } = filter;

  if (!conditions || conditions.length === 0) {
    return true;
  }

  let result = evaluateFilter(conditions[0], row);

  for (let i = 1; i < conditions.length; i++) {
    const next = conditions[i];
    const nextResult = evaluateFilter(next, row);

    if (next.logic === "or") {
      result = result || nextResult;
    } else {
      result = result && nextResult;
    }
  }

  return result;
}
