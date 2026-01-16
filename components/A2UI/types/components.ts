/**
 * A2UI Component Types
 *
 * These types represent component entries in surfaceUpdate messages.
 *
 * @see https://a2ui.org/reference/messages/#surfaceupdate
 */

/**
 * A single component entry in the adjacency list.
 *
 * The `component` field contains exactly one key representing the
 * component type (e.g., "Text", "Button", "Column"), with its value
 * being the component's properties.
 *
 * @example
 * ```json
 * {
 *   "id": "greeting",
 *   "component": {
 *     "Text": {
 *       "text": { "literalString": "Hello, World!" },
 *       "usageHint": "h1"
 *     }
 *   }
 * }
 * ```
 */
export interface A2UIComponentEntry {
  /** Unique identifier within the surface */
  id: string;
  /** Wrapper containing exactly one component type key */
  component: A2UIComponentWrapper;
}

/**
 * Wrapper object containing exactly one component type key.
 *
 * The key is the component type name, and the value is the props object.
 */
export type A2UIComponentWrapper = {
  [componentType: string]: Record<string, unknown>;
};

/**
 * Resolved component ready for rendering.
 *
 * This is the internal representation after extracting
 * the type and props from the wrapper format.
 */
export interface ResolvedComponent {
  /** The component type name */
  type: string;
  /** The component's props */
  props: Record<string, unknown>;
}

/**
 * A node in the resolved component tree.
 *
 * This represents a component with its children resolved
 * from the adjacency list into a nested structure.
 */
export interface ResolvedNode {
  /** Unique identifier */
  id: string;
  /** The component type name */
  type: string;
  /** The component's props (excluding children) */
  props: Record<string, unknown>;
  /** Resolved child nodes */
  children: (ResolvedNode | string)[];
}
