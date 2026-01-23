import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponentType = React.ComponentType<any>;

/**
 * Checks if any direct child of the given children matches the specified component type.
 * Useful for detecting if a user has explicitly provided a component in composition API.
 *
 * @param children - React children to scan
 * @param componentType - The component type to search for
 * @returns true if a matching child is found
 */
export function hasChildOfType(
  children: React.ReactNode,
  componentType: AnyComponentType,
): boolean {
  let found = false;
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === componentType) {
      found = true;
    }
  });
  return found;
}

/**
 * Recursively checks if any child (at any depth) matches the specified component type.
 *
 * @param children - React children to scan
 * @param componentType - The component type to search for
 * @returns true if a matching child is found at any nesting level
 */
export function hasChildOfTypeDeep(
  children: React.ReactNode,
  componentType: AnyComponentType,
): boolean {
  let found = false;

  const search = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (found) {
        return;
      }
      if (React.isValidElement(child)) {
        if (child.type === componentType) {
          found = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((child.props as any).children) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          search((child.props as any).children);
        }
      }
    });
  };

  search(children);
  return found;
}
