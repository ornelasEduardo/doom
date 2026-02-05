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

  // Merge external props with potentially user-provided props
  const target = isExternal ? "_blank" : props.target;

  let rel = props.rel;
  if (target === "_blank") {
    const relParts = new Set((props.rel || "").split(" ").filter(Boolean));
    relParts.add("noopener");
    relParts.add("noreferrer");
    rel = Array.from(relParts).join(" ");
  }
  // If isExternal is true, we force target="_blank"
  // If user provided target="_blank", we also ensure rel is set.

  const mergedProps = {
    ...props,
    target,
    rel,
  };

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
      {...mergedProps}
    >
      {children}
      {isExternal && <ExternalLink className="ml-1" size={14} />}
    </a>
  );
}
