"use client";
import clsx from "clsx";
import React, { useId, useState } from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import type { ControlSize } from "../../styles/types";
import { Label } from "../Label/Label";
import styles from "./Textarea.module.scss";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  classNames?: ThemeClassNames<"Textarea">;
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  size?: ControlSize;
}

export function Textarea({
  classNames,
  label,
  error,
  helperText,
  showCount,
  size = "md",
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
  const doomPart = useThemeParts("Textarea", classNames, { size: size });

  const reactId = useId();
  const textareaId = id || `textarea-${reactId}`;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;

  const [charCount, setCharCount] = useState(
    (value?.toString() || defaultValue?.toString() || "").length,
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const describedBy =
    clsx(helperText && helperId, error && errorId) || undefined;

  return (
    <div
      {...doomPart("root", {
        className: clsx(
          styles.container,
          size !== "md" && styles[size],
          className,
        ),
      })}
      style={style}
    >
      {label && (
        <Label {...doomPart("label")} htmlFor={textareaId} required={required}>
          {label}
        </Label>
      )}

      <textarea
        aria-describedby={describedBy}
        aria-invalid={!!error}
        {...doomPart("textarea", {
          className: clsx(styles.textarea, error && styles.error),
        })}
        defaultValue={defaultValue}
        id={textareaId}
        maxLength={maxLength}
        required={required}
        value={value}
        onChange={handleChange}
        {...props}
      />

      {(error || helperText || (showCount ?? maxLength !== undefined)) && (
        <div {...doomPart("bottomRow", { className: styles.bottomRow })}>
          <div {...doomPart("messageArea", { className: styles.messageArea })}>
            {error ? (
              <span
                {...doomPart("helperText", {
                  "data-invalid": true,
                  className: clsx(styles.helperText, styles.error),
                })}
                id={errorId}
                role="alert"
              >
                {error}
              </span>
            ) : (
              helperText && (
                <span
                  {...doomPart("helperText", { className: styles.helperText })}
                  id={helperId}
                >
                  {helperText}
                </span>
              )
            )}
          </div>

          {(showCount ?? maxLength !== undefined) && (
            <span {...doomPart("counter", { className: styles.counter })}>
              {charCount}
              {maxLength !== undefined ? ` / ${maxLength}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
