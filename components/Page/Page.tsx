"use client";

import clsx from "clsx";
import React from "react";

import styles from "./Page.module.scss";

interface PageProps {
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
  children,
  variant = "default",
  className,
  style,
}: PageProps) {
  return (
    <main
      className={clsx(styles.container, styles[variant], className)}
      style={style}
    >
      {children}
    </main>
  );
}
