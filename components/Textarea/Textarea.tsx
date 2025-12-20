"use client";

import React, { useState, useId } from "react";
import clsx from "clsx";
import { Label } from "../Label/Label";
import styles from "./Textarea.module.scss";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export function Textarea({
  label,
  error,
  helperText,
  showCount,
  className,
  style,
  id,
  required,
  maxLength,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const reactId = useId();
  const textareaId = id || `textarea-${reactId}`;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;

  const [charCount, setCharCount] = useState(
    (value?.toString() || defaultValue?.toString() || "").length
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    if (onChange) onChange(e);
  };

  // Sync charCount if value is updated externally (controlled)
  React.useEffect(() => {
    if (value !== undefined) {
      setCharCount(value.toString().length);
    }
  }, [value]);

  const describedBy =
    clsx(helperText && helperId, error && errorId) || undefined;

  return (
    <div className={clsx(styles.container, className)} style={style}>
      {label && (
        <Label htmlFor={textareaId} required={required}>
          {label}
        </Label>
      )}

      <textarea
        className={clsx(styles.textarea, error && styles.error)}
        id={textareaId}
        required={required}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...props}
      />

      {(error || helperText || (showCount ?? maxLength !== undefined)) && (
        <div className={styles.bottomRow}>
          <div className={styles.messageArea}>
            {error ? (
              <span
                id={errorId}
                className={clsx(styles.helperText, styles.error)}
                role="alert"
              >
                {error}
              </span>
            ) : (
              helperText && (
                <span id={helperId} className={styles.helperText}>
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
