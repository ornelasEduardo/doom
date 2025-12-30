"use client";

import clsx from "clsx";
import React, { useId, useState } from "react";

import { Label } from "../Label/Label";
import styles from "./Input.module.scss";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "title"
> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  showCount?: boolean;
  format?: (value: string | number | readonly string[] | undefined) => string;
  validate?: (
    value: string | number | readonly string[] | undefined,
  ) => string | undefined;
}

export function Input({
  label,
  error: errorProp,
  helperText,
  startAdornment,
  endAdornment,
  showCount,
  style,
  className,
  format,
  validate,
  onBlur,
  onFocus,
  onChange,
  value,
  defaultValue,
  id,
  required,
  maxLength,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>(
    undefined,
  );
  const [charCount, setCharCount] = useState(
    (value?.toString() || defaultValue?.toString() || "").length,
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
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharCount(e.target.value.length);
    if (onChange) {
      onChange(e);
    }
  };

  // Sync charCount if value is updated externally (controlled)
  React.useEffect(() => {
    if (value !== undefined) {
      setCharCount(value.toString().length);
    }
  }, [value]);

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
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={clsx(
            styles.input,
            startAdornment && styles.hasStartAdornment,
            endAdornment && styles.hasEndAdornment,
            error && styles.error,
          )}
          defaultValue={defaultValue}
          id={inputId}
          maxLength={maxLength}
          required={required}
          value={displayValue}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          {...props}
        />
        {endAdornment && (
          <span className={clsx(styles.adornment, styles.end)}>
            {endAdornment}
          </span>
        )}
      </div>

      {(error || helperText || (showCount ?? maxLength !== undefined)) && (
        <div className={styles.bottomRow}>
          <div className={styles.messageArea}>
            {error ? (
              <span
                className={clsx(styles.helperText, styles.error)}
                id={errorId}
                role="alert"
              >
                {error}
              </span>
            ) : (
              helperText && (
                <span className={styles.helperText} id={helperId}>
                  {helperText}
                </span>
              )
            )}
          </div>

          {(showCount ?? maxLength !== undefined) && (
            <span className={styles.counter}>
              {charCount}
              {maxLength !== undefined ? ` / ${maxLength}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
