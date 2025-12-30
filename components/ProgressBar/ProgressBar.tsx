"use client";

import clsx from "clsx";
import React from "react";

import { Label } from "../Label/Label";
import styles from "./ProgressBar.module.scss";

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
        aria-label={!label ? props["aria-label"] || "Progress" : undefined}
        aria-labelledby={label ? labelId : undefined}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={clampedValue}
        className={styles.container}
        id={barId}
        role="progressbar"
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
          data-complete={percentage >= 100}
          style={
            {
              "--percentage": `${percentage}%`,
              "--color": color,
            } as React.CSSProperties
          }
        />
        {showStripes && <div className={styles.stripes} />}
      </div>
    </div>
  );
}
