"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
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

export interface ButtonLoadingIndicatorContext {
  props: {
    className?: string;
    "aria-hidden": true;
    [attribute: `data-${string}`]: string | boolean | undefined;
  };
  size: ControlSize;
  loading: true;
  disabled: boolean;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  classNames?: ThemeClassNames<"Button">;
  variant?: ButtonVariant;
  size?: ControlSize;
  loading?: boolean;
  renderLoadingIndicator?: (
    context: ButtonLoadingIndicatorContext,
  ) => React.ReactNode;
}

export function Button({
  classNames,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  renderLoadingIndicator,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const doomPart = useThemeParts("Button", classNames, {
    variant: variant,
    size: size,
    loading: loading,
    disabled: disabled,
  });

  const buttonClass = clsx(
    styles.button,
    styles[variant],
    size !== "md" && styles[size],
    loading && styles.loading,
    className,
  );

  const indicatorProps = doomPart("spinner", { className: styles.spinnerIcon });

  return (
    <button
      {...doomPart("root", { className: buttonClass })}
      disabled={disabled || loading}
      {...props}
    >
      {loading &&
        (renderLoadingIndicator ? (
          renderLoadingIndicator({
            props: { ...indicatorProps, "aria-hidden": true },
            size,
            loading,
            disabled: true,
          })
        ) : (
          <Spinner {...indicatorProps} size="sm" />
        ))}
      <span {...doomPart("label", { className: styles.label })}>
        {children}
      </span>
    </button>
  );
}
