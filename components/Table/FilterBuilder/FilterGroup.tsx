"use client";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";

import { Badge } from "../../Badge/Badge";
import { Button } from "../../Button/Button";
import { Card } from "../../Card/Card";
import { Input } from "../../Input/Input";
import { Select } from "../../Select/Select";
import { Text } from "../../Text/Text";
import type { FilterOperatorKey } from "../utils/filterAst";
import { OPERATORS } from "../utils/filterAst";
import type { FilterField } from "./FilterBuilder";
import styles from "./FilterGroup.module.scss";
import { MAX_DEPTH } from "./utils/tree-utils";

export interface FilterConditionItem {
  type: "condition";
  id: string;
  field: string;
  operator: FilterOperatorKey;
  value: string;
  logic?: "and" | "or";
}

export interface FilterGroupItem {
  type: "group";
  id: string;
  children: FilterItem[];
  collapsed?: boolean;
  logic?: "and" | "or"; // Logic connecting this group to PREVIOUS
}

export type FilterItem = FilterConditionItem | FilterGroupItem;

function countConditions(item: FilterItem): number {
  if (item.type === "condition") {
    return 1;
  }
  return item.children.reduce((sum, child) => sum + countConditions(child), 0);
}

// Internal reusable DropZone
function DropZone({
  targetId,
  position,
  style,
  onHoverChange,
}: {
  targetId: string;
  position: "before" | "after" | "inside";
  style?: React.CSSProperties;
  onHoverChange?: (isOver: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    return dropTargetForElements({
      element: el,
      getData: () => ({ targetId, position }),
      onDragEnter: () => {
        setIsOver(true);
        onHoverChange?.(true);
      },
      onDragLeave: () => {
        setIsOver(false);
        onHoverChange?.(false);
      },
      onDrop: () => {
        setIsOver(false);
        onHoverChange?.(false);
      },
    });
  }, [targetId, position, onHoverChange]);

  return (
    <div ref={ref} className={styles.dropTargetZone} style={style}>
      {isOver && (
        <div className={clsx(styles.dropIndicator, styles[position])} />
      )}
    </div>
  );
}

interface ConditionRowProps {
  item: FilterConditionItem;
  fields: FilterField[];
  parentId: string;
  logic?: "and" | "or";
  showLogic?: boolean;
  isGlobalDragging: boolean;
  onUpdate: (updated: FilterConditionItem) => void;
  onRemove: () => void;
  onLogicChange?: (logic: "and" | "or") => void;
}

function ConditionRow({
  item,
  fields,
  parentId,
  logic,
  showLogic = false,
  isGlobalDragging,
  onUpdate,
  onRemove,
  onLogicChange,
}: ConditionRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeDrops, setActiveDrops] = useState(0);

  const handleHoverChange = (isOver: boolean) => {
    setActiveDrops((prev) => prev + (isOver ? 1 : -1));
  };

  const selectedField = fields.find((f) => f.key === item.field);
  const availableOperators = selectedField?.operators ?? [
    "eq",
    "neq",
    "contains",
  ];

  useEffect(() => {
    const el = rowRef.current;
    const handle = handleRef.current;
    if (!el || !handle) {
      return;
    }

    const cleanupDraggable = draggable({
      element: el,
      dragHandle: handle,
      getInitialData: () => ({
        type: "condition",
        id: item.id,
        parentId,
        item,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDraggable();
    };
  }, [item, parentId]);

  return (
    <Card
      ref={rowRef}
      className={clsx(
        styles.conditionRow,
        isDragging && styles.dragging,
        activeDrops > 0 && styles.zIndexHigh,
      )}
    >
      {isGlobalDragging && !isDragging && (
        <>
          <DropZone
            position="inside"
            style={{ top: 0, height: "100%", zIndex: 10 }}
            targetId={item.id}
            onHoverChange={handleHoverChange}
          />
          <DropZone
            position="before"
            style={{ top: 0, height: "25%", zIndex: 20 }}
            targetId={item.id}
            onHoverChange={handleHoverChange}
          />
          <DropZone
            position="after"
            style={{ bottom: 0, height: "25%", zIndex: 20 }}
            targetId={item.id}
            onHoverChange={handleHoverChange}
          />
        </>
      )}

      <div ref={handleRef} className={styles.dragHandle}>
        <GripVertical size={16} />
      </div>

      {showLogic && logic && onLogicChange ? (
        <div style={{ width: 80 }}>
          <Select
            options={[
              { value: "and", label: "AND" },
              { value: "or", label: "OR" },
            ]}
            size="sm"
            value={logic}
            onChange={(e) => onLogicChange(e.target.value as "and" | "or")}
          />
        </div>
      ) : (
        <div
          style={{
            width: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Badge size="lg" variant="secondary">
            WHERE
          </Badge>
        </div>
      )}

      <Select
        className={styles.fieldSelect}
        options={fields.map((f) => ({ value: f.key, label: f.label }))}
        placeholder="Field..."
        value={item.field}
        onChange={(e) =>
          onUpdate({ ...item, field: e.target.value as string, value: "" })
        }
      />
      <Select
        className={styles.operatorSelect}
        options={availableOperators.map((op) => ({
          value: op,
          label: OPERATORS[op].label,
        }))}
        value={item.operator}
        onChange={(e) =>
          onUpdate({ ...item, operator: e.target.value as FilterOperatorKey })
        }
      />
      {selectedField?.type === "select" && selectedField.options ? (
        <Select
          className={styles.valueSelect}
          options={selectedField.options}
          placeholder="Value..."
          value={item.value}
          onChange={(e) =>
            onUpdate({ ...item, value: e.target.value as string })
          }
        />
      ) : (
        <Input
          className={styles.valueInput}
          placeholder="Value..."
          value={item.value}
          onChange={(e) => onUpdate({ ...item, value: e.target.value })}
        />
      )}
      <Button aria-label="Remove" size="sm" variant="ghost" onClick={onRemove}>
        <Trash2 size={16} />
      </Button>
    </Card>
  );
}

interface FilterGroupProps {
  group: FilterGroupItem;
  fields: FilterField[];
  depth?: number;
  showLogic?: boolean;
  isDragging?: boolean;
  onUpdate: (updated: FilterGroupItem) => void;
  onRemove?: () => void;
  onRemoveSourceById?: (id: string) => void;
  onLogicChange?: (logic: "and" | "or") => void;
}

export function FilterGroup({
  group,
  fields,
  depth = 0,
  showLogic = false,
  isDragging: isGlobalDragging = false,
  onUpdate,
  onRemove,
  onRemoveSourceById,
  onLogicChange,
}: FilterGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(group.collapsed ?? false);
  const [activeDrops, setActiveDrops] = useState(0);

  const handleHoverChange = (isOver: boolean) => {
    setActiveDrops((prev) => prev + (isOver ? 1 : -1));
  };

  useEffect(() => {
    const el = groupRef.current;
    const handle = handleRef.current;
    if (!el || !handle) {
      return;
    }

    const cleanupDraggable = draggable({
      element: el,
      dragHandle: handle,
      getInitialData: () => ({
        type: "group",
        id: group.id,
        group,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDraggable();
    };
  }, [group, idPrefix, onUpdate, onRemoveSourceById]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onUpdate({ ...group, collapsed: !isCollapsed });
  };

  const addCondition = () => {
    const newCondition: FilterConditionItem = {
      type: "condition",
      id: `${idPrefix}-${Date.now()}`,
      field: "",
      operator: "eq",
      value: "",
      logic: "and",
    };
    onUpdate({ ...group, children: [...group.children, newCondition] });
  };

  const addNestedGroup = () => {
    const newGroup: FilterGroupItem = {
      type: "group",
      id: `${idPrefix}-group-${Date.now()}`,
      children: [],
      logic: "and",
    };
    onUpdate({ ...group, children: [...group.children, newGroup] });
  };

  const updateChild = (index: number, updated: FilterItem) => {
    const next = [...group.children];
    next[index] = updated;
    onUpdate({ ...group, children: next });
  };

  const removeChild = (index: number) => {
    onUpdate({
      ...group,
      children: group.children.filter((_, i) => i !== index),
    });
  };

  const removeChildById = (id: string) => {
    onUpdate({
      ...group,
      children: group.children.filter((c) => c.id !== id),
    });
  };

  const conditionCount = countConditions(group);
  const isEmpty = group.children.length === 0;

  return (
    <Card
      ref={groupRef}
      className={clsx(
        styles.group,
        depth === 0 && styles.rootGroup,
        depth > 0 && styles.hasRail,
        isCollapsed && styles.collapsed,
        isDragging && styles.dragging,
        activeDrops > 0 && styles.zIndexHigh,
      )}
      style={{ marginLeft: 0, position: "relative" }}
    >
      {/* Drop targets for the Group itself */}
      {isGlobalDragging && !isDragging && depth > 0 && (
        <>
          <DropZone
            position="inside"
            style={{
              top: 0,
              height: "100%",
              zIndex: 10,
            }}
            targetId={group.id}
            onHoverChange={handleHoverChange}
          />
          <DropZone
            position="before"
            style={{ top: 0, height: "10px", zIndex: 30 }}
            targetId={group.id}
            onHoverChange={handleHoverChange}
          />
          <DropZone
            position="after"
            style={{ bottom: 0, height: "10px", zIndex: 30 }}
            targetId={group.id}
            onHoverChange={handleHoverChange}
          />
        </>
      )}

      <div className={styles.groupHeader}>
        <div ref={handleRef} className={styles.dragHandle}>
          <GripVertical size={16} />
        </div>

        {depth > 0 &&
          (showLogic && group.logic && onLogicChange ? (
            <div style={{ width: 80 }}>
              <Select
                options={[
                  { value: "and", label: "AND" },
                  { value: "or", label: "OR" },
                ]}
                size="sm"
                value={group.logic}
                onChange={(e) => onLogicChange(e.target.value as "and" | "or")}
              />
            </div>
          ) : (
            <div
              style={{
                width: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Badge size="lg" variant="secondary">
                WHERE
              </Badge>
            </div>
          ))}

        <Button
          aria-label={isCollapsed ? "Expand group" : "Collapse group"}
          className={styles.collapseToggle}
          size="sm"
          variant="ghost"
          onClick={toggleCollapse}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </Button>
        {isCollapsed && (
          <Text
            className={styles.collapsedSummary}
            color="muted"
            variant="caption"
          >
            ({conditionCount} condition{conditionCount !== 1 ? "s" : ""})
          </Text>
        )}
        <div className={styles.headerSpacer} />
        {onRemove && (
          <Button
            aria-label="Remove group"
            size="sm"
            variant="ghost"
            onClick={onRemove}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      <div
        ref={contentRef}
        className={styles.groupContentWrapper}
        style={{
          height: isCollapsed ? 0 : "auto",
          overflow: isCollapsed ? "hidden" : "visible",
        }}
      >
        <div className={styles.groupContent}>
          {isEmpty ? (
            <div className={styles.emptyState}>
              <Text color="muted" variant="small">
                Start by adding a condition
                {depth < MAX_DEPTH ? " or a group" : ""}.
              </Text>
              <div className={styles.emptyActions}>
                <Button size="sm" variant="ghost" onClick={addCondition}>
                  <Plus size={14} /> Add Condition
                </Button>
                <Button
                  disabled={depth >= MAX_DEPTH}
                  size="sm"
                  variant="ghost"
                  onClick={addNestedGroup}
                >
                  <Plus size={14} /> Add Group
                </Button>
              </div>
            </div>
          ) : (
            group.children.map((child, index) => (
              <React.Fragment key={child.id}>
                {child.type === "condition" ? (
                  <ConditionRow
                    fields={fields}
                    isGlobalDragging={isGlobalDragging}
                    item={child}
                    logic={child.logic}
                    parentId={group.id}
                    showLogic={index > 0}
                    onLogicChange={(newLogic) =>
                      updateChild(index, { ...child, logic: newLogic })
                    }
                    onRemove={() => removeChild(index)}
                    onUpdate={(updated) => updateChild(index, updated)}
                  />
                ) : (
                  <div className={styles.nestedGroupWrapper}>
                    <FilterGroup
                      depth={depth + 1}
                      fields={fields}
                      group={child}
                      isDragging={isGlobalDragging} // Pass down global dragging state
                      showLogic={index > 0}
                      onLogicChange={(newLogic) =>
                        updateChild(index, { ...child, logic: newLogic })
                      }
                      onRemove={() => removeChild(index)}
                      onRemoveSourceById={removeChildById}
                      onUpdate={(updated) => updateChild(index, updated)}
                    />
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>

        {!isEmpty && (
          <div className={styles.groupActions}>
            <Button size="sm" variant="ghost" onClick={addCondition}>
              <Plus size={14} /> Condition
            </Button>
            <Button
              disabled={depth >= MAX_DEPTH}
              size="sm"
              variant="ghost"
              onClick={addNestedGroup}
            >
              <Plus size={14} /> Add Group
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
