/**
 * Resolve Value Utility
 *
 * Resolves A2UI values (literal or path references) against a data model.
 */

import type { DataModelEntry } from "../types";
import { isLiteralString, isPathReference } from "../types";

/**
 * Resolves an A2UI text value to its string content.
 *
 * @param value - The value to resolve (literalString or path reference)
 * @param dataModel - The data model for path resolution
 * @returns The resolved string value, or undefined if not found
 *
 * @example
 * ```ts
 * // Literal value
 * resolveTextValue({ literalString: "Hello" }, {});
 * // "Hello"
 *
 * // Path reference
 * resolveTextValue({ path: "/user/name" }, { user: { name: "Alice" } });
 * // "Alice"
 * ```
 */
export function resolveTextValue(
  value: unknown,
  dataModel: Record<string, unknown>,
): string | undefined {
  if (isLiteralString(value)) {
    return value.literalString;
  }

  if (isPathReference(value)) {
    return resolvePathValue(value.path, dataModel);
  }

  // If it's already a plain string, return it
  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

/**
 * Resolves a path reference against the data model.
 *
 * Paths are formatted as "/key1/key2/key3" and are resolved
 * by traversing the data model object.
 *
 * @param path - The path string (e.g., "/user/name")
 * @param dataModel - The data model to resolve against
 * @returns The resolved value as a string, or undefined if not found
 */
export function resolvePathValue(
  path: string,
  dataModel: Record<string, unknown>,
): string | undefined {
  // Remove leading slash and split into segments
  const segments = path.replace(/^\//, "").split("/").filter(Boolean);

  let current: unknown = dataModel;

  for (const segment of segments) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  // Convert to string if we found a value
  if (current === undefined || current === null) {
    return undefined;
  }

  if (typeof current === "object") {
    return JSON.stringify(current);
  }

  return String(current);
}

/**
 * Converts an A2UI data model adjacency list to a plain object.
 *
 * @param contents - The data model entries
 * @returns A plain JavaScript object
 *
 * @example
 * ```ts
 * const entries = [
 *   { key: "name", valueString: "Alice" },
 *   { key: "age", valueNumber: 30 }
 * ];
 * dataModelToObject(entries);
 * // { name: "Alice", age: 30 }
 * ```
 */
export function dataModelToObject(
  contents: DataModelEntry[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const entry of contents) {
    if (entry.valueString !== undefined) {
      result[entry.key] = entry.valueString;
    } else if (entry.valueNumber !== undefined) {
      result[entry.key] = entry.valueNumber;
    } else if (entry.valueBoolean !== undefined) {
      result[entry.key] = entry.valueBoolean;
    } else if (entry.valueMap !== undefined) {
      result[entry.key] = dataModelToObject(entry.valueMap);
    }
  }

  return result;
}
