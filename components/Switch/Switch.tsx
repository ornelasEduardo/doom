"use client";

import clsx from "clsx";
import React from "react";

import styles from "./Switch.module.scss";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
  readOnly?: boolean;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    { checked = false, onChange, disabled, label, id, className, ...props },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
      onChange?.(e.target.checked);
    };

    return (
      <label
        className={clsx(
          styles.switchContainer,
          disabled && styles.disabled,
          className,
        )}
      >
        <input
          ref={ref}
          aria-checked={checked}
          checked={checked}
          className={styles.input}
          disabled={disabled}
          id={id}
          readOnly={props.readOnly}
          role="switch"
          type="checkbox"
          onChange={handleChange}
          {...props}
        />
        <div className={clsx(styles.toggle, checked && styles.checked)} />
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  },
);

Switch.displayName = "Switch";
