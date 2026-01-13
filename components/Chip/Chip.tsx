"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React from "react";

import styles from "./Chip.module.scss";

type ChipVariant = "default" | "primary" | "success" | "warning" | "error";
type ChipSize = "xs" | "sm" | "md" | "lg" | "xl";

const DISMISS_ICON_SIZE: Record<ChipSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 20,
};

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant;
  size?: ChipSize;
  onDismiss?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      variant = "default",
      size = "md",
      onDismiss,
      disabled = false,
      children,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const isInteractive = !!onClick || !!onDismiss;
    const isClickable = !!onClick;

    return (
      <div
        ref={ref}
        className={clsx(
          styles.chip,
          styles[variant],
          styles[size],
          isInteractive && styles.interactive,
          isClickable && styles.clickable,
          disabled && styles.disabled,
          className,
        )}
        role={onClick ? "button" : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <span className={styles.content}>{children}</span>
        {onDismiss && !disabled && (
          <button
            aria-label="Dismiss"
            className={styles.dismissButton}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <X size={DISMISS_ICON_SIZE[size]} />
          </button>
        )}
      </div>
    );
  },
);

Chip.displayName = "Chip";
