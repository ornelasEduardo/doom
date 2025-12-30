"use client";

import clsx from "clsx";
import React, { createContext, useContext } from "react";

import styles from "./RadioGroup.module.scss";

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(
  undefined,
);

interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({
  name,
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled,
  children,
  className,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <RadioGroupContext.Provider
      value={{ name, value: currentValue, onChange: handleChange, disabled }}
    >
      <div className={clsx(styles.group, className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RadioGroupItem({
  value,
  children,
  disabled,
  className,
}: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within RadioGroup");
  }

  const checked = context.value === value;
  const isDisabled = disabled || context.disabled;

  return (
    <label
      aria-disabled={isDisabled}
      className={clsx(
        styles.itemLabel,
        isDisabled && styles.disabled,
        className,
      )}
    >
      <input
        checked={checked}
        className={styles.hiddenInput}
        disabled={isDisabled}
        name={context.name}
        type="radio"
        value={value}
        onChange={() => !isDisabled && context.onChange(value)}
      />
      <div
        aria-hidden="true"
        className={clsx(styles.radioCircle, checked && styles.checked)}
      >
        {checked && <div className={styles.innerDot} />}
      </div>
      <span className={styles.labelText}>{children}</span>
    </label>
  );
}
