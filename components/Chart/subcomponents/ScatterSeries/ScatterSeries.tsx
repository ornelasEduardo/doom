"use strict";

import { useMemo } from "react";

import { useChartContext } from "../../context";
import { Accessor } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { useSeriesRegistration } from "../../utils/hooks";
import { createScales } from "../../utils/scales";
import styles from "./ScatterSeries.module.scss";

interface ScatterSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
  color?: string;
  label?: string;
  hideCursor?: boolean;
}

export function ScatterSeries<T>({
  data: localData,
  x: localX,
  y: localY,
  color,
  label,
  hideCursor,
}: ScatterSeriesProps<T>) {
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
      "scatter",
    );
  }, [data, width, height, margin, xAccessor, yAccessor]);

  useSeriesRegistration({
    label: label || "Scatter Series",
    color: color,
    y: localY || contextY,
    hideCursor: hideCursor,
  });

  if (!scaleCtx || !xAccessor || !yAccessor) {
    return null;
  }
  const { xScale, yScale } = scaleCtx;
  const strokeColor = color || "var(--primary)";

  return (
    <g className="chart-scatter-series">
      {data.map((d, i) => {
        const cx = (xScale as any)(xAccessor(d));
        const cy = yScale(yAccessor(d));
        const isHovered = hoverState && hoverState.data === d;
        const isDimmed = hoverState && !isHovered;

        return (
          <circle
            key={i}
            className={styles.dot}
            cx={cx}
            cy={cy}
            r={isHovered ? 8 : 6}
            style={{
              stroke: strokeColor,
              fill: isHovered ? strokeColor : undefined,
              opacity: isDimmed ? 0.6 : 1,
            }}
          />
        );
      })}
    </g>
  );
}

export function ScatterSeriesWrapper(props: ScatterSeriesProps<any>) {
  const { config } = useChartContext();
  return (
    <g transform={`translate(${config.margin.left}, ${config.margin.top})`}>
      <ScatterSeries {...props} />
    </g>
  );
}
