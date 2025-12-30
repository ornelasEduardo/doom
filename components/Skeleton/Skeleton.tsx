"use client";

import clsx from "clsx";
import React from "react";

import styles from "./Skeleton.module.scss";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  width,
  height,
  variant = "rectangular",
  className,
  style,
  ...props
}: SkeletonProps) {
  const customStyle = {
    "--width": width,
    "--height": height,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      className={clsx(styles.skeleton, styles[variant], className)}
      style={customStyle}
      {...props}
    />
  );
}
