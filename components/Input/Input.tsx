"use client";

import React, { useState, useId } from "react";
import clsx from "clsx";
import { Label } from "../Label/Label";
import styles from "./Input.module.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  format?: (value: string | number | readonly string[] | undefined) => string;
  validate?: (
    value: string | number | readonly string[] | undefined
  ) => string | undefined;
}

export function Input({
  label,
  error: errorProp,
  helperText,
  startAdornment,
  endAdornment,
  style,
  className,
  format,
  validate,
  onBlur,
  onFocus,
  value,
  id,
  required,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>(
    undefined
  );

  const reactId = useId();
  const inputId = id || `input-${reactId}`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const error = errorProp || internalError;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (validate) {
      setInternalError(validate(e.target.value));
    }
    if (onBlur) onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const displayValue =
    !isFocused && format && value !== undefined ? format(value) : value;

  const describedBy =
    clsx(helperText && helperId, error && errorId) || undefined;

  return (
    <div className={clsx(styles.container, className)} style={style}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}

      <div className={styles.wrapper}>
        {startAdornment && (
          <span className={clsx(styles.adornment, styles.start)}>
            {startAdornment}
          </span>
        )}
        <input
          className={clsx(
            styles.input,
            startAdornment && styles.hasStartAdornment,
            endAdornment && styles.hasEndAdornment,
            error && styles.error
          )}
          id={inputId}
          required={required}
          value={displayValue}
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        />
        {endAdornment && (
          <span className={clsx(styles.adornment, styles.end)}>
            {endAdornment}
          </span>
        )}
      </div>

      {helperText && !error && (
        <span id={helperId} className={styles.helperText}>
          {helperText}
        </span>
      )}

      {error && (
        <span
          id={errorId}
          className={clsx(styles.helperText, styles.error)}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}
