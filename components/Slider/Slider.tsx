"use client";

import clsx from "clsx";
import styles from "./Slider.module.scss";
import React from "react";

interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "defaultValue"
  > {
  label?: string;
  showValue?: boolean;
  value?: number | [number, number];
  defaultValue?: number | [number, number];
  onChange?: (value: number | [number, number]) => void;
}

import { Label } from "../Label/Label";

export function Slider({
  label,
  showValue,
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  id,
  ...props
}: SliderProps) {
  const reactId = React.useId();
  const inputId = id || `slider-${reactId}`;

  // Normalize initial value
  const initialValue =
    defaultValue !== undefined
      ? defaultValue
      : Array.isArray(value)
      ? value
      : (min as number);

  const [internalValue, setInternalValue] = React.useState<
    number | [number, number]
  >(initialValue);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const isRange = Array.isArray(currentValue);

  // Helper to ensure types match logic
  const valArray = isRange
    ? (currentValue as [number, number])
    : [currentValue as number, currentValue as number];
  const minLimit = Number(min);
  const maxLimit = Number(max);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index?: 0 | 1
  ) => {
    const newVal = Number(e.target.value);

    if (!isRange) {
      if (!isControlled) setInternalValue(newVal);
      onChange?.(newVal);
    } else {
      const newArray = [...valArray] as [number, number];

      if (index === 0) {
        // Changing Min: Don't exceed Max
        newArray[0] = Math.min(newVal, valArray[1]);
      } else {
        // Changing Max: Don't go below Min
        newArray[1] = Math.max(newVal, valArray[0]);
      }

      if (!isControlled) setInternalValue(newArray);
      onChange?.(newArray);
    }
  };

  // Calculate Percentage for Track Fill
  const getPercentage = (val: number) =>
    ((val - minLimit) / (maxLimit - minLimit)) * 100;

  const startPercent = isRange ? getPercentage(valArray[0]) : 0;
  const endPercent = isRange
    ? getPercentage(valArray[1])
    : getPercentage(valArray[0]);
  const widthPercent = endPercent - startPercent;

  return (
    <div className={clsx(styles.container, className)}>
      {(label || showValue) && (
        <div className={styles.labelRow}>
          {label && <Label htmlFor={inputId}>{label}</Label>}
          {showValue && (
            <span className={styles.valueDisplay}>
              {isRange ? `${valArray[0]} - ${valArray[1]}` : valArray[0]}
            </span>
          )}
        </div>
      )}
      <div className={styles.trackWrapper}>
        <div
          className={styles.progressFill}
          style={
            {
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
            } as React.CSSProperties
          }
        />

        {!isRange ? (
          <input
            id={inputId}
            className={styles.rangeInput}
            type="range"
            min={min}
            max={max}
            step={step}
            value={valArray[0]}
            onChange={(e) => handleChange(e)}
            aria-label={!label ? props["aria-label"] || "Slider" : undefined}
            aria-valuenow={valArray[0]}
            aria-valuemin={minLimit}
            aria-valuemax={maxLimit}
            {...props}
          />
        ) : (
          <>
            {/* Min Thumb */}
            <input
              id={`${inputId}-min`}
              className={styles.multiRangeInput}
              type="range"
              min={min}
              max={max}
              step={step}
              value={valArray[0]}
              onChange={(e) => handleChange(e, 0)}
              aria-label="Minimum value"
              style={{ zIndex: valArray[0] > maxLimit - 10 ? 21 : 20 }}
            />
            {/* Max Thumb */}
            <input
              id={`${inputId}-max`}
              className={styles.multiRangeInput}
              type="range"
              min={min}
              max={max}
              step={step}
              value={valArray[1]}
              onChange={(e) => handleChange(e, 1)}
              aria-label="Maximum value"
              style={{ zIndex: 20 }}
            />
          </>
        )}
      </div>
    </div>
  );
}
