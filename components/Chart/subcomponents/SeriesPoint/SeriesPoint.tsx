import React, { memo } from "react";

import styles from "./SeriesPoint.module.scss";

export interface SeriesPointProps extends React.SVGProps<SVGCircleElement> {
  x: number;
  y: number;
  color?: string;
  isHovered?: boolean;
  isDimmed?: boolean;
  radius?: number;
  hoverRadius?: number;
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

    return (
      <circle
        className={`${styles.point} ${className || ""}`}
        cx={x}
        cy={y}
        r={isHovered ? hoverRadius : radius}
        style={computedStyle}
        {...props}
      />
    );
  },
);

SeriesPoint.displayName = "SeriesPoint";
