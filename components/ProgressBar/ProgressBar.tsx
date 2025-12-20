"use client";

import clsx from "clsx";
import styles from "./ProgressBar.module.scss";
import React from "react";
import { Label } from "../Label/Label";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  height?: string | number;
  color?: string;
  showStripes?: boolean;
  label?: React.ReactNode;
}

export function ProgressBar({
  value,
  max = 100,
  height = "24px",
  color = "var(--primary)",
  showStripes = true,
  label,
  className,
  style,
  id,
  ...props
}: ProgressBarProps) {
  const reactId = React.useId();
  const barId = id || `progress-${reactId}`;
  const labelId = `label-${reactId}`;

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const clampedValue = Math.min(Math.max(value, 0), max);
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && <Label id={labelId}>{label}</Label>}
      <div
        id={barId}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? props["aria-label"] || "Progress" : undefined}
        className={styles.container}
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
    </div>
  );
}
