"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import styles from "./Page.module.scss";

interface PageProps {
  classNames?: ThemeClassNames<"Page">;
  children: React.ReactNode;
  /**
   * 'default': Constrained width (65vw) with standard padding.
   * 'fullWidth': Spans the entire viewport width with no default padding.
   */
  variant?: "default" | "fullWidth";
  className?: string;
  style?: React.CSSProperties;
}

export function Page({
  classNames,
  children,
  variant = "default",
  className,
  style,
}: PageProps) {
  const doomPart = useThemeParts("Page", classNames, { variant: variant });

  return (
    <main
      {...doomPart("root", {
        className: clsx(styles.container, styles[variant], className),
      })}
      style={style}
    >
      {children}
    </main>
  );
}
