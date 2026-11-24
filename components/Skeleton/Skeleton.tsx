"use client";
import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import styles from "./Skeleton.module.scss";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  classNames?: ThemeClassNames<"Skeleton">;
  width?: string;
  height?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  classNames,
  width,
  height,
  variant = "rectangular",
  className,
  style,
  ...props
}: SkeletonProps) {
  const doomPart = useThemeParts("Skeleton", classNames, { variant: variant });

  const customStyle = {
    "--width": width,
    "--height": height,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      {...doomPart("root", {
        className: clsx(styles.skeleton, styles[variant], className),
      })}
      style={customStyle}
      {...props}
    />
  );
}
