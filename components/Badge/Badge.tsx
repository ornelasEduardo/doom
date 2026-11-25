"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
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
  classNames?: ThemeClassNames<"Badge">;
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

export function Badge({
  classNames,
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: BadgeProps) {
  const doomPart = useThemeParts("Badge", classNames, {
    variant: variant,
    size: size,
  });

  return (
    <span
      {...doomPart("root", {
        className: clsx(styles.badge, styles[variant], styles[size], className),
      })}
      {...props}
    >
      {children}
    </span>
  );
}
