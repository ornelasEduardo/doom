"use client";

import clsx from "clsx";
import { ExternalLink } from "lucide-react";
import React, { useEffect, useState } from "react";

import styles from "./Link.module.scss";

export type LinkVariant = "default" | "button" | "subtle";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  variant?: LinkVariant;
  prefetch?: boolean;
  isExternal?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Link({
  children,
  variant = "default",
  prefetch,
  isExternal,
  disabled,
  className,
  onClick,
  onMouseEnter,
  ...props
}: LinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      return;
    }
    if (prefetch && !shouldPrefetch) {
      setShouldPrefetch(true);
    }
    onMouseEnter?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  useEffect(() => {
    if (shouldPrefetch && props.href && typeof document !== "undefined") {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = props.href;
      link.as = "document";
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [shouldPrefetch, props.href]);

  const { target, rel, ...restProps } = props;
  const computedTarget = target ?? (isExternal ? "_blank" : undefined);

  // Use simple array join to avoid depending on clsx behavior for non-class attributes
  // and ensure we don't accidentally rely on external libs for security critical path if we can avoid it.
  // Note: clsx is imported for className usage, but keeping rel logic vanilla is safer/cleaner here.
  const computedRel = [
    rel,
    computedTarget === "_blank" && "noopener noreferrer"
  ]
  .filter(Boolean)
  .join(" ");

  return (
    <a
      aria-disabled={disabled}
      className={clsx(
        styles.link,
        styles[variant],
        disabled && styles.disabled,
        className,
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      rel={computedRel || undefined}
      target={computedTarget}
      {...restProps}
    >
      {children}
      {isExternal && <ExternalLink className="ml-1" size={14} />}
    </a>
  );
}
