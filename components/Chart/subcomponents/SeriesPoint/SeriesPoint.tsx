import React, { memo, useEffect, useRef } from "react";

import { registerGpuMark } from "../../rendering/scene";
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
    datum,
    ...props
  }: SeriesPointProps) => {
    const point = useRef<SVGCircleElement>(null);
    const renderedRadius = isHovered ? hoverRadius : radius;
    useEffect(() => {
      if (!point.current || !Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      return registerGpuMark(point.current, {
        kind: "point",
        x,
        y,
        radius: renderedRadius,
      });
    }, [x, y, renderedRadius]);
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
        ref={(node) => {
          point.current = node;
          if (node) {
            (node as SVGCircleElement & { __data__?: unknown }).__data__ =
              datum;
          }
        }}
        aria-label={description || "Data point"}
        aria-roledescription="data point"
        className={`${styles.point} ${className || ""}`}
        cx={x}
        cy={y}
        data-chart-gpu-mark="point"
        fillOpacity={0}
        r={isHovered ? hoverRadius : radius}
        role="graphics-symbol"
        strokeOpacity={0}
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
