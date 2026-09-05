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
  target,
  rel,
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

  const effectiveTarget = target ?? (isExternal ? "_blank" : undefined);
  let effectiveRel = rel;
  if (effectiveTarget?.toLowerCase() === "_blank") {
    const seen = new Set<string>();
    effectiveRel = [
      ...(rel?.split(/\s+/).filter(Boolean) ?? []),
      "noopener",
      "noreferrer",
    ]
      .filter((token) => {
        const key = token.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join(" ");
  }

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
      target={effectiveTarget}
      rel={effectiveRel}
      {...props}
    >
      {children}
      {isExternal && <ExternalLink className="ml-1" size={14} />}
    </a>
  );
}
