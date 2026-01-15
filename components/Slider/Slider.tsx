"use client";

import clsx from "clsx";
import React from "react";

import { Label } from "../Label/Label";
import { Text } from "../Text/Text";
import styles from "./Slider.module.scss";

interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "defaultValue"
> {
  label?: string;
  showValue?: boolean;
  value?: number | [number, number];
  defaultValue?: number | [number, number];
  onChange?: (value: number | [number, number]) => void;
}

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
    index?: 0 | 1,
  ) => {
    const newVal = Number(e.target.value);

    if (!isRange) {
      if (!isControlled) {
        setInternalValue(newVal);
      }
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

      if (!isControlled) {
        setInternalValue(newArray);
      }
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
            <Text className={styles.valueDisplay} variant="small" weight="bold">
              {isRange ? `${valArray[0]} - ${valArray[1]}` : valArray[0]}
            </Text>
          )}
        </div>
      )}
      <div className={styles.trackWrapper}>
        <div className={styles.trackInner}>
          <div
            className={styles.progressFill}
            style={
              {
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              } as React.CSSProperties
            }
          />
        </div>

        {!isRange ? (
          <input
            aria-label={!label ? props["aria-label"] || "Slider" : undefined}
            aria-valuemax={maxLimit}
            aria-valuemin={minLimit}
            aria-valuenow={valArray[0]}
            className={styles.rangeInput}
            id={inputId}
            max={max}
            min={min}
            step={step}
            type="range"
            value={valArray[0]}
            onChange={(e) => handleChange(e)}
            {...props}
          />
        ) : (
          <>
            {/* Min Thumb */}
            <input
              aria-label="Minimum value"
              className={styles.multiRangeInput}
              id={`${inputId}-min`}
              max={max}
              min={min}
              step={step}
              style={{ zIndex: valArray[0] > maxLimit - 10 ? 21 : 20 }}
              type="range"
              value={valArray[0]}
              onChange={(e) => handleChange(e, 0)}
            />
            {/* Max Thumb */}
            <input
              aria-label="Maximum value"
              className={styles.multiRangeInput}
              id={`${inputId}-max`}
              max={max}
              min={min}
              step={step}
              style={{ zIndex: 20 }}
              type="range"
              value={valArray[1]}
              onChange={(e) => handleChange(e, 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
