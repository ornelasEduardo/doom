'use client';

import clsx from "clsx";
import { Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import type { ControlSize } from "../../styles/types";
import { Tooltip } from "../Tooltip";

import styles from "./Rating.module.scss";

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  count?: number;
  icon?: LucideIcon;
  allowHalf?: boolean;
  size?: ControlSize;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

// Icon size mapping per ControlSize
const iconSizeMap: Record<ControlSize, number> = {
  sm: 16,
  md: 20,
  lg: 32,
};

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(function Rating({
  value: controlledValue,
  defaultValue = 0,
  onValueChange,
  count = 5,
  icon: IconComponent = Star,
  allowHalf = false,
  size = "md",
  readOnly = false,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}, ref) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const displayValue = hoverValue !== null && !readOnly && !disabled ? hoverValue : currentValue;

  const iconSize = iconSizeMap[size];

  const setValue = useCallback(
    (next: number) => {
      if (disabled) return;
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [disabled, isControlled, onValueChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || readOnly) return;

      const step = allowHalf ? 0.5 : 1;
      let newValue = currentValue;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          newValue = Math.min(currentValue + step, count);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          newValue = Math.max(currentValue - step, 0);
          break;
        case "Home":
          e.preventDefault();
          newValue = 0;
          break;
        case "End":
          e.preventDefault();
          newValue = count;
          break;
        default:
          return;
      }

      setValue(newValue);

      // Move focus to the new value's radio button
      if (containerRef.current) {
        const selector = `[data-value="${newValue}"]`;
        const target = containerRef.current.querySelector<HTMLButtonElement>(selector);
        target?.focus();
      }
    },
    [disabled, readOnly, allowHalf, currentValue, count, setValue],
  );

  // --- Read-only mode ---
  if (readOnly) {
    return (
      <div
        ref={ref}
        role="img"
        aria-label={ariaLabel ?? `${currentValue} out of ${count}`}
        className={clsx(styles.rating, styles[size], className)}
      >
        {Array.from({ length: count }, (_, i) => {
          const position = i + 1;
          const isFilled = currentValue >= position;
          const isHalf = !isFilled && currentValue >= position - 0.5;

          return (
            <span key={position} className={styles.iconWrapper}>
              {isHalf ? (
                <>
                  <span className={clsx(styles.icon, styles.unfilled)}>
                    {React.createElement(IconComponent, {
                      size: iconSize,
                      strokeWidth: 2.5,
                      fill: "none",
                    })}
                  </span>
                  <span className={clsx(styles.icon, styles.filled, styles.halfClip)}>
                    {React.createElement(IconComponent, {
                      size: iconSize,
                      strokeWidth: 2.5,
                      fill: "currentColor",
                    })}
                  </span>
                </>
              ) : (
                <span className={clsx(styles.icon, isFilled ? styles.filled : styles.unfilled)}>
                  {React.createElement(IconComponent, {
                    size: iconSize,
                    strokeWidth: 2.5,
                    fill: isFilled ? "currentColor" : "none",
                  })}
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  }

  // --- Interactive mode ---

  return (
    <div
      ref={mergedRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={clsx(styles.rating, styles[size], disabled && styles.disabled, className)}
      onMouseLeave={() => setHoverValue(null)}
    >
      {allowHalf
        ? // Half mode: render pairs per position
          Array.from({ length: count }, (_, i) => {
            const position = i + 1;
            const halfValue = position - 0.5;
            const fullValue = position;

            return (
              <span key={position} className={styles.iconWrapper}>
                {/* Unfilled base layer */}
                <span className={clsx(styles.icon, styles.unfilled)} aria-hidden="true">
                  {React.createElement(IconComponent, {
                    size: iconSize,
                    strokeWidth: 2.5,
                    fill: "none",
                  })}
                </span>

                {/* Filled overlay (full or half based on displayValue) */}
                {displayValue >= halfValue && (
                  <span
                    className={clsx(
                      styles.icon,
                      styles.filled,
                      styles.filledOverlay,
                      displayValue >= fullValue ? undefined : styles.halfClip,
                    )}
                    aria-hidden="true"
                  >
                    {React.createElement(IconComponent, {
                      size: iconSize,
                      strokeWidth: 2.5,
                      fill: "currentColor",
                    })}
                  </span>
                )}

                {/* Half button (left half) */}
                <Tooltip content={`${halfValue} out of ${count}`} placement="top">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={currentValue >= halfValue}
                    aria-label={`Rate ${halfValue} out of ${count}`}
                    data-value={halfValue}
                    disabled={disabled}
                    tabIndex={currentValue === halfValue || (currentValue === 0 && halfValue === 0.5) ? 0 : -1}
                    className={clsx(styles.radioButton, styles.halfButton, styles.halfLeft)}
                    onClick={() => setValue(halfValue)}
                    onMouseEnter={() => setHoverValue(halfValue)}
                    onKeyDown={handleKeyDown}
                  />
                </Tooltip>

                {/* Full button (right half) */}
                <Tooltip content={`${fullValue} out of ${count}`} placement="top">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={currentValue >= fullValue}
                    aria-label={`Rate ${fullValue} out of ${count}`}
                    data-value={fullValue}
                    disabled={disabled}
                    tabIndex={currentValue === fullValue ? 0 : -1}
                    className={clsx(styles.radioButton, styles.halfButton, styles.halfRight)}
                    onClick={() => setValue(fullValue)}
                    onMouseEnter={() => setHoverValue(fullValue)}
                    onKeyDown={handleKeyDown}
                  />
                </Tooltip>
              </span>
            );
          })
        : // Standard mode: one button per position
          Array.from({ length: count }, (_, i) => {
            const position = i + 1;
            const isFilled = displayValue >= position;

            const label = `${position} out of ${count}`;

            return (
              <Tooltip key={position} content={label} placement="top">
                <button
                  type="button"
                  role="radio"
                  aria-checked={currentValue >= position}
                  aria-label={`Rate ${position} out of ${count}`}
                  data-value={position}
                  disabled={disabled}
                  tabIndex={
                    currentValue === position || (currentValue === 0 && position === 1) ? 0 : -1
                  }
                  className={clsx(
                    styles.iconButton,
                    isFilled && styles.filled,
                    !isFilled && styles.unfilled,
                  )}
                  onClick={() => setValue(position)}
                  onMouseEnter={() => setHoverValue(position)}
                  onKeyDown={handleKeyDown}
                >
                  {React.createElement(IconComponent, {
                    size: iconSize,
                    strokeWidth: 2.5,
                    fill: isFilled ? "currentColor" : "none",
                  })}
                </button>
              </Tooltip>
            );
          })}
    </div>
  );
});

Rating.displayName = "Rating";
