"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { Label } from "../Label/Label";
import styles from "./Form.module.scss";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  classNames?: ThemeClassNames<"Form">;
  children: React.ReactNode;
}

export function Form({ classNames, children, className, ...props }: FormProps) {
  const doomPart = useThemeParts("Form", classNames, {});

  return (
    <form
      {...doomPart("root", { className: clsx(styles.form, className) })}
      {...props}
    >
      {children}
    </form>
  );
}

export interface FormMessageProps extends React.HTMLAttributes<HTMLSpanElement> {
  classNames?: ThemeClassNames<"Form">;
  children: React.ReactNode;
  variant?: "error" | "description";
}

export function FormMessage({
  classNames,
  children,
  variant = "description",
  className,
  ...props
}: FormMessageProps) {
  const doomPart = useThemeParts("Form", classNames, { variant: variant });

  return (
    <span
      {...doomPart("message", {
        className: clsx(
          styles.message,
          variant === "error" && styles.error,
          variant === "description" && styles.description,
          className,
        ),
      })}
      {...props}
    >
      {children}
    </span>
  );
}

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  classNames?: ThemeClassNames<"Form">;
  children: React.ReactNode;
  label?: string;
  error?: string | boolean;
  description?: string;
  htmlFor?: string;
  required?: boolean;
}

export function Field({
  classNames,
  children,
  label,
  error,
  description,
  htmlFor,
  required,
  className,
  ...props
}: FieldProps) {
  const doomPart = useThemeParts("Form", classNames, {});

  return (
    <div
      {...doomPart("field", { className: clsx(styles.field, className) })}
      {...props}
    >
      {label && (
        <Label {...doomPart("label")} htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}

      {description && !error && (
        <FormMessage variant="description">{description}</FormMessage>
      )}

      {error && typeof error === "string" && (
        <FormMessage variant="error">{error}</FormMessage>
      )}
    </div>
  );
}

export const FormGroup = Field;
