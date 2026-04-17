'use client';

import clsx from "clsx";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

import type { ControlSize } from "../../styles/types";

import styles from "./ToggleGroup.module.scss";

// --- Context (inline) ---

interface ItemEntry {
  value: string;
  disabled: boolean;
}

interface ToggleGroupContextType {
  activeValue: string | string[];
  toggle: (itemValue: string) => void;
  type: "single" | "multiple";
  size: ControlSize;
  disabled: boolean;
  registerItem: (ref: HTMLButtonElement | null, value: string, itemDisabled: boolean) => void;
  unregisterItem: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, value: string) => void;
  tabbableValue: string | null;
}

const ToggleGroupContext = createContext<ToggleGroupContextType | null>(null);

// --- ToggleGroup ---

export interface ToggleGroupProps {
  type: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  size?: ControlSize;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

export function ToggleGroup({
  type,
  value: controlledValue,
  defaultValue,
  onValueChange,
  size = "md",
  disabled = false,
  className,
  children,
  "aria-label": ariaLabel,
}: ToggleGroupProps) {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue ?? (type === "multiple" ? [] : ""),
  );

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const itemOrder = useRef<string[]>([]);
  const [focusedValue, setFocusedValue] = useState<string | null>(null);
  const [items, setItems] = useState<ItemEntry[]>([]);

  const toggle = useCallback(
    (itemValue: string) => {
      let nextValue: string | string[];
      if (type === "single") {
        const current = (typeof activeValue === "string" ? activeValue : "") as string;
        nextValue = current === itemValue ? "" : itemValue;
      } else {
        const arr = Array.isArray(activeValue) ? activeValue : [];
        nextValue = arr.includes(itemValue)
          ? arr.filter((v) => v !== itemValue)
          : [...arr, itemValue];
      }

      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [type, activeValue, isControlled, onValueChange],
  );

  const registerItem = useCallback((ref: HTMLButtonElement | null, value: string, itemDisabled: boolean) => {
    if (ref) {
      itemRefs.current.set(value, ref);
      if (!itemOrder.current.includes(value)) {
        itemOrder.current.push(value);
      }
      setItems((prev) => {
        const existing = prev.find((it) => it.value === value);
        if (existing && existing.disabled === itemDisabled) return prev;
        const filtered = prev.filter((it) => it.value !== value);
        // Insert at same position as itemOrder
        const idx = itemOrder.current.indexOf(value);
        filtered.splice(idx, 0, { value, disabled: itemDisabled });
        return filtered;
      });
    }
  }, []);

  const unregisterItem = useCallback((value: string) => {
    itemRefs.current.delete(value);
    itemOrder.current = itemOrder.current.filter((v) => v !== value);
    setItems((prev) => prev.filter((it) => it.value !== value));
  }, []);

  const getEnabledItems = useCallback(() => {
    return itemOrder.current.filter((v) => {
      const el = itemRefs.current.get(v);
      return el && !el.disabled;
    });
  }, []);

  // Compute the tabbable item: focused > pressed > first enabled
  const tabbableValue = (() => {
    const enabledValues = items.filter((it) => !it.disabled).map((it) => it.value);
    if (enabledValues.length === 0) return null;

    // If a focused value is set and still enabled, use it
    if (focusedValue && enabledValues.includes(focusedValue)) return focusedValue;

    // Use the pressed item (first pressed in multiple mode)
    if (type === "single") {
      const pressed = typeof activeValue === "string" ? activeValue : "";
      if (pressed && enabledValues.includes(pressed)) return pressed;
    } else {
      const arr = Array.isArray(activeValue) ? activeValue : [];
      const firstPressed = arr.find((v) => enabledValues.includes(v));
      if (firstPressed) return firstPressed;
    }

    // Fall back to first enabled item
    return enabledValues[0] ?? null;
  })();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, _value: string) => {
      const enabledItems = getEnabledItems();
      if (enabledItems.length === 0) return;

      const currentEl = e.currentTarget as HTMLButtonElement;
      const currentValue = currentEl.getAttribute("data-value") || "";
      const currentIndex = enabledItems.indexOf(currentValue);

      let nextIndex: number | null = null;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % enabledItems.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
      }

      if (nextIndex !== null) {
        const nextVal = enabledItems[nextIndex];
        setFocusedValue(nextVal);
        const nextEl = itemRefs.current.get(nextVal);
        nextEl?.focus();
      }
    },
    [getEnabledItems],
  );

  return (
    <ToggleGroupContext.Provider
      value={{
        activeValue,
        toggle,
        type,
        size,
        disabled,
        registerItem,
        unregisterItem,
        handleKeyDown,
        tabbableValue,
      }}
    >
      <div
        aria-label={ariaLabel}
        className={clsx(styles.toggleGroup, className)}
        role="group"
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

// --- ToggleGroupItem ---

export interface ToggleGroupItemProps {
  value: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  children: React.ReactNode;
}

export function ToggleGroupItem({
  value,
  disabled: itemDisabled,
  "aria-label": ariaLabel,
  className,
  children,
}: ToggleGroupItemProps) {
  const context = useContext(ToggleGroupContext);
  if (!context) {
    throw new Error("ToggleGroupItem must be used within <ToggleGroup>");
  }

  const isDisabled = itemDisabled || context.disabled;

  const isPressed =
    context.type === "single"
      ? context.activeValue === value
      : Array.isArray(context.activeValue) && context.activeValue.includes(value);

  const refCallback = useCallback(
    (el: HTMLButtonElement | null) => {
      if (el) {
        context.registerItem(el, value, isDisabled);
      } else {
        context.unregisterItem(value);
      }
    },
    [value, isDisabled, context.registerItem, context.unregisterItem],
  );

  const handleClick = () => {
    if (!isDisabled) {
      context.toggle(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
      context.handleKeyDown(e, value);
    }
  };

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isPressed}
      className={clsx(
        styles.toggleGroupItem,
        styles[context.size],
        isPressed && styles.pressed,
        isDisabled && styles.disabled,
        className,
      )}
      data-value={value}
      disabled={isDisabled}
      ref={refCallback}
      tabIndex={context.tabbableValue === value ? 0 : -1}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
}
