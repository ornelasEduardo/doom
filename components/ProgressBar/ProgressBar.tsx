"use client";

import clsx from "clsx";
import styles from "./ProgressBar.module.scss";
import React from "react";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  height?: string | number;
  color?: string;
  showStripes?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  height = "24px",
  color = "var(--primary)",
  showStripes = true,
  className,
  style,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const clampedValue = Math.min(Math.max(value, 0), max);
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={clsx(styles.container, className)}
      style={
        {
          "--height": heightStyle,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className={styles.fill}
        style={
          {
            "--percentage": `${percentage}%`,
            "--color": color,
          } as React.CSSProperties
        }
        data-complete={percentage >= 100}
      />
      {showStripes && <div className={styles.stripes} />}
    </div>
  );
}
