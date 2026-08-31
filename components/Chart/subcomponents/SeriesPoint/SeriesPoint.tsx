import React, { memo } from "react";

import styles from "./SeriesPoint.module.scss";

export interface SeriesPointProps extends React.SVGProps<SVGCircleElement> {
  /**
   * Accessible name for this mark. The parent series owns the accessors, so it
   * builds the name — the point itself stays presentational.
   */
  description?: string;
  x: number;
  y: number;
  color?: string;
  isHovered?: boolean;
  isDimmed?: boolean;
  radius?: number;
  hoverRadius?: number;
  datum?: unknown;
}

export const SeriesPoint = memo(
  ({
    x,
    y,
    color,
    isHovered,
    isDimmed,
    radius = 5,
    hoverRadius = 8,
    className,
    style,
    description,
    ...props
  }: SeriesPointProps) => {
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
      return null;
    }

    const baseColor = color || "var(--primary)";

    const dimmedStyles = {
      opacity: 0.6,
    };

    const computedStyle: React.CSSProperties = {
      fill: baseColor,
      ...(isDimmed ? dimmedStyles : {}),
      ...style,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datum = (props as any).datum;

    return (
      <circle
        ref={(node) => {
          if (node) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node as any).__data__ = datum;
          }
        }}
        aria-label={description || "Data point"}
        aria-roledescription="data point"
        className={`${styles.point} ${className || ""}`}
        cx={x}
        cy={y}
        r={isHovered ? hoverRadius : radius}
        role="graphics-symbol"
        style={{
          ...computedStyle,
          pointerEvents: "all",
        }}
        {...props}
      />
    );
  },
);

SeriesPoint.displayName = "SeriesPoint";
