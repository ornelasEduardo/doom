'use client';

import clsx from "clsx";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

import type { ControlSize } from "../../styles/types";

import styles from "./ToggleGroup.module.scss";

// --- Context (inline) ---

interface ToggleGroupContextType {
  activeValue: string | string[];
  toggle: (itemValue: string) => void;
  type: "single" | "multiple";
  size: ControlSize;
  variant: "primary" | "outline";
  disabled: boolean;
  registerItem: (ref: HTMLButtonElement | null, value: string) => void;
  unregisterItem: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, value: string) => void;
}

const ToggleGroupContext = createContext<ToggleGroupContextType | null>(null);

// --- ToggleGroup ---

export interface ToggleGroupProps {
  type: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  size?: ControlSize;
  variant?: "primary" | "outline";
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
  variant = "outline",
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

  const registerItem = useCallback((ref: HTMLButtonElement | null, value: string) => {
    if (ref) {
      itemRefs.current.set(value, ref);
      if (!itemOrder.current.includes(value)) {
        itemOrder.current.push(value);
      }
    }
  }, []);

  const unregisterItem = useCallback((value: string) => {
    itemRefs.current.delete(value);
    itemOrder.current = itemOrder.current.filter((v) => v !== value);
  }, []);

  const getEnabledItems = useCallback(() => {
    return itemOrder.current.filter((value) => {
      const el = itemRefs.current.get(value);
      return el && !el.disabled;
    });
  }, []);

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
        const nextValue = enabledItems[nextIndex];
        const nextEl = itemRefs.current.get(nextValue);
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
        variant,
        disabled,
        registerItem,
        unregisterItem,
        handleKeyDown,
      }}
    >
      <div
        aria-label={ariaLabel}
        className={clsx(styles.toggleGroup, styles[variant], className)}
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
        context.registerItem(el, value);
      } else {
        context.unregisterItem(value);
      }
    },
    [value, context.registerItem, context.unregisterItem],
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
        styles[context.variant],
        styles[context.size],
        isPressed && styles.pressed,
        isDisabled && styles.disabled,
        className,
      )}
      data-value={value}
      disabled={isDisabled}
      ref={refCallback}
      tabIndex={0}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
}
