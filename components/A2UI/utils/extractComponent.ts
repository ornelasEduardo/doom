/**
 * Extract Component Utility
 *
 * Extracts the component type and props from the A2UI wrapper format.
 */

import type { A2UIComponentWrapper, ResolvedComponent } from "../types";

/**
 * Extracts the component type and props from the A2UI wrapper format.
 *
 * The A2UI format wraps component data as:
 * ```json
 * { "Text": { "text": { "literalString": "Hello" } } }
 * ```
 *
 * This function extracts the type ("Text") and props ({ text: ... }).
 *
 * @param wrapper - The wrapped component object
 * @returns The resolved component with type and props, or null if invalid
 *
 * @example
 * ```ts
 * const wrapper = { "Button": { "label": "Click me" } };
 * const result = extractComponent(wrapper);
 * // { type: "Button", props: { label: "Click me" } }
 * ```
 */
export function extractComponent(
  wrapper: A2UIComponentWrapper,
): ResolvedComponent | null {
  const keys = Object.keys(wrapper);

  if (keys.length !== 1) {
    console.warn(
      `A2UI: Component wrapper must have exactly one key, found ${keys.length}`,
      wrapper,
    );
    return null;
  }

  const type = keys[0];
  const props = wrapper[type];

  if (typeof props !== "object" || props === null) {
    console.warn(`A2UI: Component props must be an object for type "${type}"`);
    return null;
  }

  return { type, props };
}
