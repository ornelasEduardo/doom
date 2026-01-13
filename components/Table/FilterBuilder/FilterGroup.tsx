"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";

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
  logic?: "and" | "or";
}

export type FilterItem = FilterConditionItem | FilterGroupItem;

function countConditions(item: FilterItem): number {
  if (item.type === "condition") {
    return 1;
  }
  return item.children.reduce((sum, child) => sum + countConditions(child), 0);
}

function DropZone({
  targetId,
  position,
  style,
  className,
  onHoverChange,
}: {
  targetId: string;
  position: "before" | "after" | "inside";
  style?: React.CSSProperties;
  className?: string;
  onHoverChange?: (isOver: boolean) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${targetId}-${position}`,
    data: { targetId, position },
  });

  useEffect(() => {
    onHoverChange?.(isOver);
  }, [isOver, onHoverChange]);

  return (
    <div
      ref={setNodeRef}
      className={clsx(styles.dropTargetZone, className)}
      style={style}
    >
      {isOver && (
        <div className={clsx(styles.dropIndicator, styles[position])} />
      )}
    </div>
  );
}

export interface ConditionRowProps {
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

export function ConditionRow({
  item,
  fields,
  parentId: _parentId,
  logic,
  showLogic = false,
  isGlobalDragging,
  onUpdate,
  onRemove,
  onLogicChange,
}: ConditionRowProps) {
  const [activeDrops, setActiveDrops] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { type: "condition", item },
  });

  const handleHoverChange = useCallback((isOver: boolean) => {
    setActiveDrops((prev) => prev + (isOver ? 1 : -1));
  }, []);

  const showZones = isGlobalDragging && !isDragging;

  const selectedField = fields.find((f) => f.key === item.field);
  const availableOperators = selectedField?.operators ?? [
    "eq",
    "neq",
    "contains",
  ];

  return (
    <Card.Root
      ref={setNodeRef}
      className={clsx(
        styles.conditionRow,
        isDragging && styles.dragging,
        activeDrops > 0 && styles.zIndexHigh,
      )}
    >
      <DropZone
        className={clsx(styles.dropZoneInside, showZones && styles.zoneActive)}
        position="inside"
        targetId={item.id}
        onHoverChange={handleHoverChange}
      />
      <DropZone
        className={clsx(styles.dropZoneBefore, showZones && styles.zoneActive)}
        position="before"
        targetId={item.id}
        onHoverChange={handleHoverChange}
      />
      <DropZone
        className={clsx(styles.dropZoneAfter, showZones && styles.zoneActive)}
        position="after"
        targetId={item.id}
        onHoverChange={handleHoverChange}
      />

      {/* Header elements: Drag, Logic, Collapse, Remove (mobile) */}
      {/* Header elements: Drag, Logic, Collapse, Remove (mobile) */}
      <div className={styles.conditionHeader}>
        <div
          className={styles.dragHandle}
          onContextMenu={(e) => e.preventDefault()}
          {...listeners}
          {...attributes}
        >
          <GripVertical size={16} />
        </div>

        {showLogic && logic && onLogicChange ? (
          <div className={styles.logicWrapper}>
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
          <div className={styles.whereWrapper}>
            <Badge className={styles.whereBadge} size="lg" variant="secondary">
              WHERE
            </Badge>
          </div>
        )}

        <Button
          aria-label={isCollapsed ? "Expand" : "Collapse"}
          className={styles.mobileCollapseToggle}
          size="sm"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </Button>

        <Button
          aria-label="Remove"
          className={styles.mobileRemoveButton}
          size="sm"
          variant="ghost"
          onClick={onRemove}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Collapsed summary - mobile only */}
      {isCollapsed && (
        <Text
          className={styles.collapsedConditionSummary}
          color="muted"
          variant="body"
          onClick={() => setIsCollapsed(false)}
        >
          {selectedField?.label || item.field || "Field"}{" "}
          <strong>{OPERATORS[item.operator]?.label || item.operator}</strong>{" "}
          {item.value || "..."}
        </Text>
      )}

      {/* Expanded form fields */}
      <div
        className={clsx(
          styles.conditionFields,
          isCollapsed && styles.conditionFieldsCollapsed,
        )}
      >
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
      </div>

      {/* Desktop remove button - visible only on larger screens */}
      <Button
        aria-label="Remove"
        className={styles.desktopRemoveButton}
        size="sm"
        variant="ghost"
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </Card.Root>
  );
}

interface FilterGroupProps {
  item: FilterGroupItem;
  fields: FilterField[];
  parentId: string;
  depth?: number;
  showLogic?: boolean;
  isGlobalDragging?: boolean;
  onUpdate: (updated: FilterGroupItem) => void;
  onRemove?: () => void;
  onRemoveSourceById?: (id: string) => void;
  onLogicChange?: (logic: "and" | "or") => void;
}

export function FilterGroup({
  item,
  fields,
  parentId: _parentId,
  depth = 0,
  showLogic = false,
  isGlobalDragging = false,
  onUpdate,
  onRemove,
  onRemoveSourceById: _onRemoveSourceById,
  onLogicChange,
}: FilterGroupProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();
  const [isCollapsed, setIsCollapsed] = useState(item.collapsed ?? false);
  const [activeDrops, setActiveDrops] = useState(0);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { type: "group", item },
  });

  const handleHoverChange = useCallback((isOver: boolean) => {
    setActiveDrops((prev) => prev + (isOver ? 1 : -1));
  }, []);

  const showZones = isGlobalDragging && !isDragging;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onUpdate({ ...item, collapsed: !isCollapsed });
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
    onUpdate({ ...item, children: [...item.children, newCondition] });
  };

  const addNestedGroup = () => {
    const newGroup: FilterGroupItem = {
      type: "group",
      id: `${idPrefix}-group-${Date.now()}`,
      children: [],
      logic: "and",
    };
    onUpdate({ ...item, children: [...item.children, newGroup] });
  };

  const updateChild = (index: number, updated: FilterItem) => {
    const next = [...item.children];
    next[index] = updated;
    onUpdate({ ...item, children: next });
  };

  const removeChild = (index: number) => {
    onUpdate({
      ...item,
      children: item.children.filter((_: FilterItem, i: number) => i !== index),
    });
  };

  const removeChildById = (id: string) => {
    onUpdate({
      ...item,
      children: item.children.filter((c: FilterItem) => c.id !== id),
    });
  };

  const conditionCount = countConditions(item);
  const isEmpty = item.children.length === 0;

  return (
    <Card.Root
      ref={setNodeRef}
      className={clsx(
        styles.group,
        depth === 0 && styles.rootGroup,
        depth > 0 && styles.hasRail,
        isCollapsed && styles.collapsed,
        isDragging && styles.dragging,
        activeDrops > 0 && styles.zIndexHigh,
      )}
    >
      {/* Drop targets for the Group itself */}
      {depth > 0 && (
        <>
          <DropZone
            className={clsx(
              styles.dropZoneInside,
              showZones && styles.zoneActive,
            )}
            position="inside"
            targetId={item.id}
            onHoverChange={handleHoverChange}
          />
          <DropZone
            className={clsx(
              styles.groupDropZoneBefore,
              showZones && styles.zoneActive,
            )}
            position="before"
            targetId={item.id}
            onHoverChange={handleHoverChange}
          />
          <DropZone
            className={clsx(
              styles.groupDropZoneAfter,
              showZones && styles.zoneActive,
            )}
            position="after"
            targetId={item.id}
            onHoverChange={handleHoverChange}
          />
        </>
      )}

      {/* Header elements: Drag, Logic, Collapse, Remove (mobile) */}
      <div className={styles.groupHeader}>
        <div
          className={styles.dragHandle}
          onContextMenu={(e) => e.preventDefault()}
          {...listeners}
          {...attributes}
        >
          <GripVertical size={16} />
        </div>

        {depth > 0 &&
          (showLogic && item.logic && onLogicChange ? (
            <div className={styles.logicWrapper}>
              <Select
                options={[
                  { value: "and", label: "AND" },
                  { value: "or", label: "OR" },
                ]}
                size="sm"
                value={item.logic}
                onChange={(e) => onLogicChange(e.target.value as "and" | "or")}
              />
            </div>
          ) : (
            <div className={styles.whereWrapper}>
              <Badge
                className={styles.whereBadge}
                size="lg"
                variant="secondary"
              >
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
        className={clsx(
          styles.groupContentWrapper,
          isCollapsed && styles.collapsedWrapper,
        )}
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
            item.children.map((child: FilterItem, index: number) => (
              <React.Fragment key={child.id}>
                {child.type === "condition" ? (
                  <ConditionRow
                    fields={fields}
                    isGlobalDragging={isGlobalDragging}
                    item={child}
                    logic={child.logic}
                    parentId={item.id}
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
                      isGlobalDragging={isGlobalDragging}
                      item={child as FilterGroupItem}
                      parentId={item.id}
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
      </div>
    </Card.Root>
  );
}
