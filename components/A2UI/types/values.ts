/**
 * A2UI Value Types
 *
 * These types represent the various value formats used in A2UI
 * for text content, child references, and data model entries.
 *
 * @see https://a2ui.org/reference/messages/
 */

/**
 * A text value that can be either a literal string or a path reference.
 *
 * @example
 * // Literal value
 * { "literalString": "Hello, World!" }
 *
 * // Path reference (resolved from data model)
 * { "path": "/user/name" }
 */
export type A2UITextValue =
  | { literalString: string; path?: never }
  | { path: string; literalString?: never };

/**
 * A reference to child component(s).
 *
 * @example
 * // Single child reference
 * "child-component-id"
 *
 * // Multiple children
 * { "explicitList": ["header", "body", "footer"] }
 */
export type A2UIChildRef = string | { explicitList: string[] };

/**
 * An entry in the data model adjacency list.
 *
 * Each entry has a key and exactly one value property.
 * This LLM-friendly structure avoids type inference issues.
 */
export interface DataModelEntry {
  /** The property key */
  key: string;
  /** String value */
  valueString?: string;
  /** Numeric value */
  valueNumber?: number;
  /** Boolean value */
  valueBoolean?: boolean;
  /** Nested map of entries */
  valueMap?: DataModelEntry[];
}

/**
 * Type guard to check if a value is a literal string.
 */
export function isLiteralString(
  value: unknown,
): value is { literalString: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "literalString" in value &&
    typeof (value as { literalString: unknown }).literalString === "string"
  );
}

/**
 * Type guard to check if a value is a path reference.
 */
export function isPathReference(value: unknown): value is { path: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    typeof (value as { path: unknown }).path === "string"
  );
}

/**
 * Type guard to check if a value is an explicit list of children.
 */
export function isExplicitList(
  value: unknown,
): value is { explicitList: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "explicitList" in value &&
    Array.isArray((value as { explicitList: unknown }).explicitList)
  );
}

/**
 * Type guard to check if a value is an A2UI text value.
 */
export function isA2UITextValue(value: unknown): value is A2UITextValue {
  return isLiteralString(value) || isPathReference(value);
}
