"use client";

import React from "react";

import { componentMap } from "./mapping";
import type {
  A2UIComponentEntry,
  ResolvedNode,
  SurfaceUpdateMessage,
} from "./types";
import { isA2UITextValue } from "./types";
import { resolveTextValue, resolveTree } from "./utils";

/**
 * Props for the A2UI Renderer component.
 */
export interface RendererProps {
  /**
   * A2UI surface update payload or array of component entries.
   *
   * Can be either:
   * - A full `surfaceUpdate` payload with surfaceId and components
   * - Just the components array for simpler usage
   */
  surface: SurfaceUpdateMessage["surfaceUpdate"] | A2UIComponentEntry[];

  /**
   * ID of the root component to render.
   *
   * Required when `surface` is a components array.
   * Optional when `surface` is a full payload (uses the first component if omitted).
   */
  rootId?: string;

  /**
   * Data model for resolving path bindings.
   *
   * When components use `{ path: "/user/name" }` values,
   * they are resolved against this object.
   */
  dataModel?: Record<string, unknown>;
}

/**
 * A2UI Renderer Component
 *
 * Renders A2UI component trees following the official message schema.
 * Handles adjacency list resolution, data binding, and component mapping.
 *
 * @see https://a2ui.org/reference/messages/
 *
 * @example
 * ```tsx
 * const surface = {
 *   surfaceId: "main",
 *   components: [
 *     { id: "root", component: { Text: { text: { literalString: "Hello!" } } } }
 *   ]
 * };
 *
 * <Renderer surface={surface} rootId="root" />
 * ```
 */
export function Renderer({
  surface,
  rootId,
  dataModel = {},
}: RendererProps): React.ReactElement | null {
  // Normalize input to components array
  const components = Array.isArray(surface) ? surface : surface.components;

  if (!components || components.length === 0) {
    return null;
  }

  // Determine root ID
  const effectiveRootId = rootId ?? components[0]?.id;

  if (!effectiveRootId) {
    console.warn("A2UI: No root ID provided and no components available");
    return null;
  }

  // Resolve adjacency list to tree
  const tree = resolveTree(components, effectiveRootId);

  if (!tree) {
    return null;
  }

  // Render the resolved tree
  return <NodeRenderer dataModel={dataModel} node={tree} />;
}

/**
 * Props for the internal NodeRenderer component.
 */
interface NodeRendererProps {
  node: ResolvedNode;
  dataModel: Record<string, unknown>;
}

/**
 * Internal component that renders a single resolved node.
 */
function NodeRenderer({
  node,
  dataModel,
}: NodeRendererProps): React.ReactElement | null {
  const { id, type, props, children } = node;

  // Look up component (case-insensitive)
  const Component =
    componentMap[type] ?? componentMap[type.toLowerCase()] ?? null;

  if (!Component) {
    console.warn(`A2UI: Unknown component type "${type}"`);
    return null;
  }

  // Resolve any data-bound props (including text -> children mapping)
  const resolvedProps = resolveProps(props, dataModel);

  // Render tree children (from adjacency list resolution)
  const renderedChildren = children.map((child, index) => {
    if (typeof child === "string") {
      return child;
    }
    return (
      <NodeRenderer
        key={child.id ?? index}
        dataModel={dataModel}
        node={child}
      />
    );
  });

  // Determine final children:
  // 1. If there are tree children (from adjacency list), use those
  // 2. Otherwise, use resolved children from props (e.g., from text prop)
  const finalChildren =
    renderedChildren.length > 0 ? renderedChildren : resolvedProps.children;

  // Remove children from props since we're passing it explicitly
  const { children: _, ...propsWithoutChildren } = resolvedProps;

  return (
    <Component {...propsWithoutChildren} key={id}>
      {finalChildren}
    </Component>
  );
}

/**
 * Resolves data-bound values in props.
 *
 * Walks through props and resolves any A2UI text values
 * (literalString or path references) to their actual values.
 *
 * Also handles A2UI-to-React prop mapping:
 * - `text` prop is mapped to `children` for React components
 */
function resolveProps(
  props: Record<string, unknown>,
  dataModel: Record<string, unknown>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (isA2UITextValue(value)) {
      const resolvedValue = resolveTextValue(value, dataModel);
      // Map A2UI 'text' prop to React 'children'
      if (key === "text") {
        resolved.children = resolvedValue;
      } else {
        resolved[key] = resolvedValue;
      }
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

// Legacy export for backward compatibility
export type { RendererProps as A2UIProps };
