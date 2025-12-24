"use client";

import React from "react";
import clsx from "clsx";
import styles from "./Badge.module.scss";

type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "secondary"
  | "outline";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

export function Badge({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(styles.badge, styles[variant], styles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
