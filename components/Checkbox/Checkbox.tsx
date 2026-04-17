"use client";

import clsx from "clsx";
import { Check, Minus } from "lucide-react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";

import { Label } from "../Label";
import styles from "./Checkbox.module.scss";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: boolean;
  indeterminate?: boolean;
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
      indeterminate,
      onChange,
      id: propsId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = propsId || generatedId;
    const internalRef = useRef<HTMLInputElement>(null);

    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
      },
      [ref],
    );

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = !!(indeterminate && !checked);
      }
    }, [indeterminate, checked]);

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
          ref={mergedRef}
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
          {indeterminate && !checked ? (
            <Minus className={styles.icon} data-testid="minus-icon" />
          ) : (
            <Check className={styles.icon} />
          )}
        </span>

        {label && <span className={styles.labelOverride}>{label}</span>}
      </Label>
    );
  },
);

Checkbox.displayName = "Checkbox";
