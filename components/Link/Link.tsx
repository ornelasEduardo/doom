"use client";

import clsx from "clsx";
import styles from "./Link.module.scss";
import React from "react";
import { ExternalLink } from "lucide-react";

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
  const [shouldPrefetch, setShouldPrefetch] = React.useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) return;
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

  const externalProps = isExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <a
      className={clsx(
        styles.link,
        styles[variant],
        disabled && styles.disabled,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      aria-disabled={disabled}
      {...externalProps}
      {...props}
    >
      {children}
      {isExternal && <ExternalLink size={14} className="ml-1" />}
      {shouldPrefetch && props.href && (
        <link rel="prefetch" href={props.href} as="document" />
      )}
    </a>
  );
}
