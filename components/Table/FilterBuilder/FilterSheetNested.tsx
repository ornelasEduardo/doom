"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import React, { useEffect, useId, useState } from "react";

import { Button } from "../../Button/Button";
import { Flex } from "../../Layout/Layout";
import { Sheet } from "../../Sheet/Sheet";
import { Text } from "../../Text/Text";
import type { FilterField } from "./FilterBuilder";
import type {
  FilterConditionItem,
  FilterGroupItem,
  FilterItem,
} from "./FilterGroup";
import { ConditionRow, FilterGroup } from "./FilterGroup";
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<FilterItem | null>(null);

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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveItem(active.data.current?.item as FilterItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) {
      return;
    }

    const sourceId = active.id as string;
    const sourceItem = active.data.current?.item as FilterItem;

    const data = over.data.current || {};
    const destTargetId = data.targetId;
    const position = data.position as DropPosition;

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

      const sourceRelativeHeight = getMaxRelativeDepth(sourceItem);
      const likelyFinalDepth = baseLevel + sourceRelativeHeight;

      if (likelyFinalDepth > MAX_DEPTH) {
        return prev;
      }

      const withoutSource = removeItem(prev, sourceId);
      return insertItem(withoutSource, sourceItem, destTargetId, position);
    });
  };

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
    <DndContext
      collisionDetection={pointerWithin}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
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
        title={
          <Text as="h1" variant="h4">
            FILTER BUILDER
          </Text>
        }
        onClose={onClose}
      >
        <div className={styles.conditionList}>
          <FilterGroup
            fields={fields}
            isGlobalDragging={activeId !== null}
            item={rootGroup}
            parentId=""
            onRemove={() => removeChildById(rootGroup.id)}
            onUpdate={(updated) => {
              setRootGroup(updated as FilterGroupItem);
            }}
          />
        </div>
      </Sheet>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div style={{ opacity: 0.9, transform: "scale(1.02)" }}>
            {activeItem.type === "group" ? (
              <FilterGroup
                fields={fields}
                isGlobalDragging={true}
                item={activeItem as FilterGroupItem}
                parentId="overlay"
                onRemove={() => {}}
                onUpdate={() => {}}
              />
            ) : (
              <ConditionRow
                fields={fields}
                isGlobalDragging={true}
                item={activeItem as FilterConditionItem}
                parentId="overlay"
                onRemove={() => {}}
                onUpdate={() => {}}
              />
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
