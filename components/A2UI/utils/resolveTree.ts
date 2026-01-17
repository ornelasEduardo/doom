/**
 * Resolve Tree Utility
 *
 * Converts A2UI's flat adjacency list into a nested component tree.
 */

import type { A2UIComponentEntry, ResolvedNode } from "../types";
import { isExplicitList } from "../types";
import { extractComponent } from "./extractComponent";

/**
 * Resolves an A2UI adjacency list to a nested component tree.
 *
 * A2UI represents component hierarchies as a flat list where each
 * component references its children by ID. This function builds
 * the nested tree structure needed for rendering.
 *
 * @param components - Flat list of component entries
 * @param rootId - ID of the root component
 * @returns The resolved tree, or null if root not found
 *
 * @example
 * ```ts
 * const components = [
 *   { id: "root", component: { Column: { children: { explicitList: ["a", "b"] } } } },
 *   { id: "a", component: { Text: { text: { literalString: "First" } } } },
 *   { id: "b", component: { Text: { text: { literalString: "Second" } } } }
 * ];
 *
 * resolveTree(components, "root");
 * // Returns nested tree with "a" and "b" as children of "root"
 * ```
 */
export function resolveTree(
  components: A2UIComponentEntry[],
  rootId: string,
): ResolvedNode | null {
  // Build lookup map for O(1) access
  const componentMap = new Map<string, A2UIComponentEntry>();
  for (const entry of components) {
    componentMap.set(entry.id, entry);
  }

  // Recursively resolve from root
  return resolveNode(rootId, componentMap, new Set());
}

/**
 * Recursively resolves a single node and its children.
 *
 * @param id - The component ID to resolve
 * @param componentMap - Map of all components by ID
 * @param visited - Set of visited IDs (for cycle detection)
 * @returns The resolved node, or null if not found
 */
function resolveNode(
  id: string,
  componentMap: Map<string, A2UIComponentEntry>,
  visited: Set<string>,
): ResolvedNode | null {
  // Cycle detection
  if (visited.has(id)) {
    console.warn(`A2UI: Circular reference detected for component "${id}"`);
    return null;
  }

  const entry = componentMap.get(id);
  if (!entry) {
    console.warn(`A2UI: Component not found: "${id}"`);
    return null;
  }

  const resolved = extractComponent(entry.component);
  if (!resolved) {
    return null;
  }

  visited.add(id);

  // Extract and resolve children
  const children = resolveChildren(resolved.props, componentMap, visited);

  // Remove children-related props as they're now resolved
  const {
    children: _,
    child: __,
    ...cleanProps
  } = resolved.props as Record<string, unknown>;

  visited.delete(id);

  return {
    id,
    type: resolved.type,
    props: cleanProps,
    children,
  };
}

/**
 * Resolves child references from component props.
 *
 * Handles both single `child` prop and `children` with explicitList.
 *
 * @param props - The component props
 * @param componentMap - Map of all components by ID
 * @param visited - Set of visited IDs
 * @returns Array of resolved child nodes
 */
function resolveChildren(
  props: Record<string, unknown>,
  componentMap: Map<string, A2UIComponentEntry>,
  visited: Set<string>,
): (ResolvedNode | string)[] {
  const children: (ResolvedNode | string)[] = [];

  // Handle "children" prop (can be explicitList or single reference)
  const childrenProp = props.children;
  if (childrenProp) {
    if (isExplicitList(childrenProp)) {
      for (const childId of childrenProp.explicitList) {
        const childNode = resolveNode(childId, componentMap, visited);
        if (childNode) {
          children.push(childNode);
        }
      }
    } else if (typeof childrenProp === "string") {
      const childNode = resolveNode(childrenProp, componentMap, visited);
      if (childNode) {
        children.push(childNode);
      }
    }
  }

  // Handle "child" prop (single child reference)
  const childProp = props.child;
  if (typeof childProp === "string") {
    const childNode = resolveNode(childProp, componentMap, visited);
    if (childNode) {
      children.push(childNode);
    }
  }

  return children;
}
