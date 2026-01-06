"use client";

import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { useEffect, useId, useState } from "react";

import { Button } from "../../Button/Button";
import { Flex } from "../../Layout/Layout";
import { Sheet } from "../../Sheet/Sheet";
import type { FilterField } from "./FilterBuilder";
import type { FilterGroupItem, FilterItem } from "./FilterGroup";
import { FilterGroup } from "./FilterGroup";
import styles from "./FilterSheet.module.scss";
import {
  DropPosition,
  getItemDepth,
  getMaxRelativeDepth,
  insertItem,
  MAX_DEPTH,
  removeItem,
} from "./utils/tree-utils";

interface FilterSheetNestedProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FilterField[];
  initialValue: FilterGroupItem | null;
  onApply: (group: FilterGroupItem) => void;
}

function countValidConditions(item: FilterItem): number {
  if (item.type === "condition") {
    return item.field && item.value ? 1 : 0;
  }
  return item.children.reduce(
    (sum, child) => sum + countValidConditions(child),
    0,
  );
}

export function FilterSheetNested({
  isOpen,
  onClose,
  fields,
  initialValue,
  onApply,
}: FilterSheetNestedProps) {
  const idPrefix = useId();
  const [isDragging, setIsDragging] = useState(false);

  /*
   * We configure 'pressHoldDelayMS' to 200ms (default is 500ms) to make the
   * drag initiation feel more responsive on mobile devices.
   */
  useEffect(() => {
    import("@dragdroptouch/drag-drop-touch").then((module) => {
      module.enableDragDropTouch(undefined, undefined, {
        pressHoldDelayMS: 200,
      });
    });
  }, []);

  const [rootGroup, setRootGroup] = useState<FilterGroupItem>(() => {
    if (initialValue) {
      return initialValue;
    }
    return {
      type: "group",
      id: `${idPrefix}-root`,
      children: [],
    };
  });

  useEffect(() => {
    if (isOpen) {
      if (initialValue) {
        setRootGroup(initialValue);
      } else {
        setRootGroup({
          type: "group",
          id: `${idPrefix}-root`,
          children: [],
        });
      }
    }
  }, [isOpen, initialValue, idPrefix]);

  useEffect(() => {
    return monitorForElements({
      onDragStart: () => setIsDragging(true),
      onDrop: ({ source, location }) => {
        setIsDragging(false);
        const destination = location.current.dropTargets[0];
        if (!destination) {
          return;
        }

        const sourceId = source.data.id as string;
        const sourceItem = (source.data.item ||
          source.data.group) as FilterItem;

        const destTargetId = destination.data.targetId as string;
        const position = destination.data.position as DropPosition;

        if (!sourceId || !destTargetId || !sourceItem || !position) {
          return;
        }

        if (sourceId === destTargetId) {
          return;
        }

        setRootGroup((prev) => {
          const destDepth = getItemDepth(prev, destTargetId);
          if (destDepth === -1) {
            return prev;
          }

          let baseLevel = destDepth;
          if (position === "inside") {
            baseLevel = destDepth + 1;
          }

          // Special case: If dropping 'inside' a condition, we create a group at destDepth.
          // The contents end up at destDepth + 1.
          // Our calculation holds: final level of source is baseLevel.
          const sourceRelativeHeight = getMaxRelativeDepth(sourceItem);
          const likelyFinalDepth = baseLevel + sourceRelativeHeight;

          if (likelyFinalDepth > MAX_DEPTH) {
            return prev;
          }

          // 1. Remove source from tree
          const withoutSource = removeItem(prev, sourceId);

          // 2. Insert at destination
          return insertItem(withoutSource, sourceItem, destTargetId, position);
        });
      },
    });
  }, []);

  const handleApply = () => {
    onApply(rootGroup);
    onClose();
  };

  const handleClear = () => {
    setRootGroup({
      type: "group",
      id: `${idPrefix}-root`,
      children: [],
    });
  };

  const removeChildById = (id: string) => {
    setRootGroup((prev) => ({
      ...prev,
      children: prev.children.filter((c) => c.id !== id),
    }));
  };

  const validCount = countValidConditions(rootGroup);

  return (
    <Sheet
      footer={
        <Flex gap={4} justify="space-between">
          <Button variant="ghost" onClick={handleClear}>
            CLEAR ALL
          </Button>
          <Button onClick={handleApply}>
            APPLY{validCount > 0 ? ` (${validCount})` : ""}
          </Button>
        </Flex>
      }
      isOpen={isOpen}
      title="FILTERS"
      onClose={onClose}
    >
      <div className={styles.conditionList}>
        <FilterGroup
          fields={fields}
          group={rootGroup}
          isDragging={isDragging}
          onRemoveSourceById={removeChildById}
          onUpdate={setRootGroup}
        />
      </div>
    </Sheet>
  );
}
