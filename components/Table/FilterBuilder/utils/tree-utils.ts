import { FilterGroupItem, FilterItem } from "../FilterGroup";

export const MAX_DEPTH = 3;

export type DropPosition = "before" | "after" | "inside";

// Calculate depth of an item by ID (Root is depth 0, Children depth 1, etc)
export function getItemDepth(
  root: FilterGroupItem,
  id: string,
  currentDepth = 0,
): number {
  if (root.id === id) {
    return currentDepth;
  }
  for (const child of root.children) {
    if (child.id === id) {
      return currentDepth + 1;
    }
    if (child.type === "group") {
      const depth = getItemDepth(child, id, currentDepth + 1);
      if (depth !== -1) {
        return depth;
      }
    }
  }
  return -1;
}

// Calculate the maximum depth of group nesting WITHIN an item
// Condition -> 0
// Group w/o subgroups -> 0
// Group w/ subdomain -> 1 + max(children)
export function getMaxRelativeDepth(item: FilterItem): number {
  if (item.type === "condition") {
    return 0;
  }
  let max = 0;
  for (const child of item.children) {
    if (child.type === "group") {
      max = Math.max(max, 1 + getMaxRelativeDepth(child));
    }
  }
  return max;
}

export function findItemPath(
  root: FilterGroupItem,
  targetId: string,
  path: { group: FilterGroupItem; index: number }[] = [],
): { group: FilterGroupItem; index: number }[] | null {
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    if (child.id === targetId) {
      return [...path, { group: root, index: i }];
    }
    if (child.type === "group") {
      const result = findItemPath(child, targetId, [
        ...path,
        { group: root, index: i },
      ]);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export function removeItem(root: FilterGroupItem, id: string): FilterGroupItem {
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== id)
      .map((c) => (c.type === "group" ? removeItem(c, id) : c)),
  };
}

// Just finds the item itself
export function findItem(root: FilterItem, id: string): FilterItem | null {
  if (root.id === id) {
    return root;
  }
  if (root.type === "group") {
    for (const child of root.children) {
      const found = findItem(child, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function insertItem(
  root: FilterGroupItem,
  item: FilterItem,
  targetId: string,
  position: DropPosition,
): FilterGroupItem {
  // If we are inserting into root (if targetId is root id), handle separately?
  // Usually targetId is a sibling for before/after, or a group for inside.

  if (root.id === targetId && position === "inside") {
    return {
      ...root,
      children: [...root.children, item],
    };
  }

  // Check if target is a direct child
  const childIndex = root.children.findIndex((c) => c.id === targetId);
  if (childIndex !== -1) {
    const newChildren = [...root.children];
    if (position === "before") {
      newChildren.splice(childIndex, 0, item);
      return { ...root, children: newChildren };
    } else if (position === "after") {
      newChildren.splice(childIndex + 1, 0, item);
      return { ...root, children: newChildren };
    } else if (position === "inside") {
      // Trying to drop inside a child
      const child = root.children[childIndex];
      if (child.type === "group") {
        // Just append to that group
        const newChild = {
          ...child,
          children: [...child.children, item],
        };
        newChildren[childIndex] = newChild;
        return { ...root, children: newChildren };
      } else {
        // Grouping with a condition -> Create new group
        // target (child) + source (item)
        const newGroup: FilterGroupItem = {
          type: "group",
          id: `group-combined-${Date.now()}`,
          logic: "and",
          children: [child, item], // You might want to reset logic on child?
        };
        newChildren[childIndex] = newGroup;
        return { ...root, children: newChildren };
      }
    }
  }

  // Recurse
  return {
    ...root,
    children: root.children.map((c) => {
      if (c.type === "group") {
        return insertItem(c, item, targetId, position);
      }
      return c;
    }),
  };
}
