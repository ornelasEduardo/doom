"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import React, { forwardRef, useId } from "react";

import { Label } from "../Label";
import styles from "./Checkbox.module.scss";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      error,
      disabled,
      checked,
      defaultChecked,
      onChange,
      id: propsId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = propsId || generatedId;

    return (
      <Label
        className={clsx(
          styles.checkboxWrapper,
          disabled && styles.disabled,
          className,
        )}
        htmlFor={id}
      >
        <input
          ref={ref}
          checked={checked}
          className={styles.checkboxInput}
          defaultChecked={defaultChecked}
          disabled={disabled}
          id={id}
          type="checkbox"
          onChange={onChange}
          {...props}
        />

        <span aria-hidden="true" className={clsx(styles.checkboxDisplay)}>
          <Check className={styles.icon} />
        </span>

        {label && <span className={styles.labelOverride}>{label}</span>}
      </Label>
    );
  },
);

Checkbox.displayName = "Checkbox";
