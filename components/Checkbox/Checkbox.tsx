"use client";

import React, { forwardRef, useId } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Label } from "../Label";
import styles from "./Checkbox.module.scss";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
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
    ref
  ) => {
    const generatedId = useId();
    const id = propsId || generatedId;

    return (
      <Label
        htmlFor={id}
        className={clsx(
          styles.checkboxWrapper,
          disabled && styles.disabled,
          className
        )}
      >
        <input
          id={id}
          type="checkbox"
          className={styles.checkboxInput}
          ref={ref}
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          {...props}
        />

        <span className={clsx(styles.checkboxDisplay)} aria-hidden="true">
          <Check className={styles.icon} />
        </span>

        {label && <span className={styles.labelOverride}>{label}</span>}
      </Label>
    );
  }
);
