"use strict";

import { useMemo } from "react";

import { useChartContext } from "../../context";
import { Accessor } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { useSeriesRegistration } from "../../utils/hooks";
import { createScales } from "../../utils/scales";
import { createRoundedTopBarPath } from "../../utils/shapes";
import styles from "./BarSeries.module.scss";

interface BarSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
  color?: string;
  hideCursor?: boolean;
}

export function BarSeries<T>({
  data: localData,
  x: localX,
  y: localY,
  color,
  hideCursor,
}: BarSeriesProps<T>) {
  const {
    data: contextData,
    width,
    height,
    config,
    x: contextX,
    y: contextY,
    hoverState,
  } = useChartContext<T>();

  const data = localData || contextData;
  const xAccessor =
    (localX ? resolveAccessor(localX) : undefined) ||
    (contextX ? resolveAccessor(contextX) : undefined);
  const yAccessor =
    (localY ? resolveAccessor(localY) : undefined) ||
    (contextY ? resolveAccessor(contextY) : undefined);

  const { margin } = config;

  const scaleCtx = useMemo(() => {
    if (!xAccessor || !yAccessor || !data.length || width <= 0 || height <= 0) {
      return null;
    }
    return createScales(
      data,
      width,
      height,
      margin,
      xAccessor,
      yAccessor,
      "bar", // Important for band scale
    );
  }, [data, width, height, margin, xAccessor, yAccessor]);

  // Registration
  useSeriesRegistration({
    label: "Bar Series",
    color: color,
    y: localY || contextY,
    hideCursor: hideCursor ?? true,
  });

  if (!scaleCtx || !xAccessor || !yAccessor) {
    return null;
  }
  const { xScale, yScale, innerHeight } = scaleCtx;

  const BAR_RADIUS = 4;
  const fillColor = color || "var(--primary)";

  return (
    <g className="chart-bar-series">
      {data.map((d, i) => {
        const xVal = (xScale as any)(xAccessor(d)) ?? 0;
        const yVal = yScale(yAccessor(d));
        const w = "bandwidth" in xScale ? xScale.bandwidth() : 10;
        const h = innerHeight - yVal;

        const isHovered = hoverState && hoverState.data === d;
        const isDimmed = hoverState && !isHovered; // Optional logic: dim others?

        // If we follow interaction.ts logic, we might not have exact object equality if referentially unstable.
        // But `data` is usually stable.

        return (
          <path
            key={i}
            className={styles.bar}
            d={createRoundedTopBarPath(xVal, yVal, w, h, BAR_RADIUS)}
            style={{
              fill: fillColor,
              opacity: isDimmed ? 0.6 : 1, // Dim others
              // Highlight hovered?
              filter: isHovered ? "brightness(1.1)" : "none",
            }}
          />
        );
      })}
    </g>
  );
}

export function BarSeriesWrapper(props: BarSeriesProps<any>) {
  const { config } = useChartContext();
  return (
    <g transform={`translate(${config.margin.left}, ${config.margin.top})`}>
      <BarSeries {...props} />
    </g>
  );
}
