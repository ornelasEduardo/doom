"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import React, { useState } from "react";

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
  value: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  copiedText?: string;
  resetDelay?: number;
}

export function CopyButton({
  value,
  children,
  variant = "secondary",
  size = "md",
  copiedText = "Copied!",
  resetDelay = 2000,
  className,
  ...props
}: CopyButtonProps) {
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
      className={clsx(
        styles.copyButton,
        styles[variant],
        copied && styles.copied,
        className,
      )}
      size={size}
      type="button"
      variant={variant}
      onClick={handleCopy}
      {...props}
    >
      <span className={styles.labelContainer}>
        <span className={styles.defaultLabel}>
          <Copy size={iconSize} strokeWidth={2.5} />
          <span>{children}</span>
        </span>

        <span className={styles.successLabel}>
          <Check size={iconSize} strokeWidth={2.5} />
          <span>{copiedText}</span>
        </span>
      </span>

      <span aria-hidden="true" className={styles.widthPreserver}>
        <span className={styles.measureItem}>
          <Copy size={iconSize} strokeWidth={2.5} />
          <span>{children}</span>
        </span>
        <span className={styles.measureItem}>
          <Check size={iconSize} strokeWidth={2.5} />
          <span>{copiedText}</span>
        </span>
      </span>
    </Button>
  );
}
