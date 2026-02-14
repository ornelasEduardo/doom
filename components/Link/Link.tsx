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

  const externalProps = isExternal ? { target: "_blank" } : {};

  // Security: Prevent reverse tabnabbing attacks when opening in a new tab.
  // Ensure we set rel="noopener noreferrer" if target is _blank.
  const isNewTab =
    props.target === "_blank" || externalProps.target === "_blank";
  const securityRel = isNewTab ? "noopener noreferrer" : "";

  // Merge security rel with any user-provided rel
  const userRel = props.rel || "";
  const combinedRel = clsx(userRel, securityRel) || undefined;

  return (
    <a
      aria-disabled={disabled}
      className={clsx(
        styles.link,
        styles[variant],
        disabled && styles.disabled,
        className,
      )}
      {...externalProps}
      {...props}
      rel={combinedRel}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {children}
      {isExternal && <ExternalLink className="ml-1" size={14} />}
    </a>
  );
}
