"use client";

import clsx from "clsx";
import React from "react";

import type { ControlSize } from "../../styles/types";
import { Spinner } from "../Spinner";
import styles from "./Button.module.scss";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "success"
  | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
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
    size !== "md" && styles[size],
    loading && styles.loading,
    className,
  );

  return (
    <button className={buttonClass} disabled={disabled || loading} {...props}>
      {loading && <Spinner className={styles.spinnerIcon} size="sm" />}
      {children}
    </button>
  );
}
