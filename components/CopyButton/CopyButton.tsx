"use client";
import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import React, { useState } from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { Button } from "../Button/Button";
import styles from "./CopyButton.module.scss";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "success"
  | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface CopyButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  classNames?: ThemeClassNames<"CopyButton">;
  value: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  copiedText?: string;
  resetDelay?: number;
}

export function CopyButton({
  classNames,
  value,
  children,
  variant = "secondary",
  size = "md",
  copiedText = "Copied!",
  resetDelay = 2000,
  className,
  ...props
}: CopyButtonProps) {
  const doomPart = useThemeParts("CopyButton", classNames, {
    variant: variant,
    size: size,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, resetDelay);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  return (
    <Button
      {...doomPart("root", {
        className: clsx(
          styles.copyButton,
          styles[variant],
          copied && styles.copied,
          className,
        ),
      })}
      size={size}
      type="button"
      variant={variant}
      onClick={handleCopy}
      {...props}
    >
      <span
        {...doomPart("labelContainer", { className: styles.labelContainer })}
      >
        <span {...doomPart("defaultLabel", { className: styles.defaultLabel })}>
          <ThemedIcon
            icon={Copy}
            iconName="copy"
            size={iconSize}
            strokeWidth={2.5}
          />
          <span>{children}</span>
        </span>

        <span {...doomPart("successLabel", { className: styles.successLabel })}>
          <ThemedIcon
            icon={Check}
            iconName="check"
            size={iconSize}
            strokeWidth={2.5}
          />
          <span>{copiedText}</span>
        </span>
      </span>

      <span
        aria-hidden="true"
        {...doomPart("widthPreserver", { className: styles.widthPreserver })}
      >
        <span {...doomPart("measureItem", { className: styles.measureItem })}>
          <ThemedIcon
            icon={Copy}
            iconName="copy"
            size={iconSize}
            strokeWidth={2.5}
          />
          <span>{children}</span>
        </span>
        <span {...doomPart("measureItem", { className: styles.measureItem })}>
          <ThemedIcon
            icon={Check}
            iconName="check"
            size={iconSize}
            strokeWidth={2.5}
          />
          <span>{copiedText}</span>
        </span>
      </span>
    </Button>
  );
}
