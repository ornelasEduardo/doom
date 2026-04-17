"use client";

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";
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

const iconSizeMap: Record<ControlSize, number> = {
  sm: 16,
  md: 20,
  lg: 32,
};

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  function Rating(
    {
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
    },
    ref,
  ) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        (
          containerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref],
    );

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;
    const displayValue =
      hoverValue !== null && !readOnly && !disabled ? hoverValue : currentValue;

    const iconSize = iconSizeMap[size];

    const setValue = useCallback(
      (next: number) => {
        if (disabled) {
          return;
        }
        if (!isControlled) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      },
      [disabled, isControlled, onValueChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled || readOnly) {
          return;
        }

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

        if (containerRef.current) {
          const selector = `[data-value="${newValue}"]`;
          const target =
            containerRef.current.querySelector<HTMLButtonElement>(selector);
          target?.focus();
        }
      },
      [disabled, readOnly, allowHalf, currentValue, count, setValue],
    );

    if (readOnly) {
      return (
        <div
          ref={ref}
          aria-label={ariaLabel ?? `${currentValue} out of ${count}`}
          className={clsx(styles.rating, styles[size], className)}
          role="img"
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
                    <span
                      className={clsx(
                        styles.icon,
                        styles.filled,
                        styles.halfClip,
                      )}
                    >
                      {React.createElement(IconComponent, {
                        size: iconSize,
                        strokeWidth: 2.5,
                        fill: "currentColor",
                      })}
                    </span>
                  </>
                ) : (
                  <span
                    className={clsx(
                      styles.icon,
                      isFilled ? styles.filled : styles.unfilled,
                    )}
                  >
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

    return (
      <div
        ref={mergedRef}
        aria-label={ariaLabel}
        className={clsx(
          styles.rating,
          styles[size],
          disabled && styles.disabled,
          className,
        )}
        role="radiogroup"
        onMouseLeave={() => setHoverValue(null)}
      >
        {allowHalf
          ? Array.from({ length: count }, (_, i) => {
              const position = i + 1;
              const halfValue = position - 0.5;
              const fullValue = position;

              return (
                <span key={position} className={styles.iconWrapper}>
                  <span
                    aria-hidden="true"
                    className={clsx(styles.icon, styles.unfilled)}
                  >
                    {React.createElement(IconComponent, {
                      size: iconSize,
                      strokeWidth: 2.5,
                      fill: "none",
                    })}
                  </span>

                  {displayValue >= halfValue && (
                    <span
                      aria-hidden="true"
                      className={clsx(
                        styles.icon,
                        styles.filled,
                        styles.filledOverlay,
                        displayValue >= fullValue ? undefined : styles.halfClip,
                      )}
                    >
                      {React.createElement(IconComponent, {
                        size: iconSize,
                        strokeWidth: 2.5,
                        fill: "currentColor",
                      })}
                    </span>
                  )}

                  <Tooltip
                    content={`${halfValue} out of ${count}`}
                    placement="top"
                  >
                    <button
                      aria-checked={currentValue >= halfValue}
                      aria-label={`Rate ${halfValue} out of ${count}`}
                      className={clsx(
                        styles.radioButton,
                        styles.halfButton,
                        styles.halfLeft,
                      )}
                      data-value={halfValue}
                      disabled={disabled}
                      role="radio"
                      tabIndex={
                        currentValue === halfValue ||
                        (currentValue === 0 && halfValue === 0.5)
                          ? 0
                          : -1
                      }
                      type="button"
                      onClick={() => setValue(halfValue)}
                      onKeyDown={handleKeyDown}
                      onMouseEnter={() => setHoverValue(halfValue)}
                    />
                  </Tooltip>

                  <Tooltip
                    content={`${fullValue} out of ${count}`}
                    placement="top"
                  >
                    <button
                      aria-checked={currentValue >= fullValue}
                      aria-label={`Rate ${fullValue} out of ${count}`}
                      className={clsx(
                        styles.radioButton,
                        styles.halfButton,
                        styles.halfRight,
                      )}
                      data-value={fullValue}
                      disabled={disabled}
                      role="radio"
                      tabIndex={currentValue === fullValue ? 0 : -1}
                      type="button"
                      onClick={() => setValue(fullValue)}
                      onKeyDown={handleKeyDown}
                      onMouseEnter={() => setHoverValue(fullValue)}
                    />
                  </Tooltip>
                </span>
              );
            })
          : Array.from({ length: count }, (_, i) => {
              const position = i + 1;
              const isFilled = displayValue >= position;

              const label = `${position} out of ${count}`;

              return (
                <Tooltip key={position} content={label} placement="top">
                  <button
                    aria-checked={currentValue >= position}
                    aria-label={`Rate ${position} out of ${count}`}
                    className={clsx(
                      styles.iconButton,
                      isFilled && styles.filled,
                      !isFilled && styles.unfilled,
                    )}
                    data-value={position}
                    disabled={disabled}
                    role="radio"
                    tabIndex={
                      currentValue === position ||
                      (currentValue === 0 && position === 1)
                        ? 0
                        : -1
                    }
                    type="button"
                    onClick={() => setValue(position)}
                    onKeyDown={handleKeyDown}
                    onMouseEnter={() => setHoverValue(position)}
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
  },
);

Rating.displayName = "Rating";
