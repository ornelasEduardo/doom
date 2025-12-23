"use client";

import React from "react";
import clsx from "clsx";
import { Spinner } from "../Spinner";
import styles from "./Button.module.scss";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "success"
  | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const buttonClass = clsx(
    styles.button,
    styles[variant],
    styles[size],
    loading && styles.loading,
    className
  );

  return (
    <button className={buttonClass} disabled={disabled || loading} {...props}>
      {loading && <Spinner size="sm" className={styles.spinnerIcon} />}
      {children}
    </button>
  );
}
