"use strict";

import { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import { useInteraction } from "../../state/store/stores/interaction/interaction.store";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/stores/series/series.store";
import { Accessor } from "../../types";
import { HoverInteraction, InteractionType } from "../../types/interaction";
import { resolveAccessor } from "../../utils/accessors";
import { createScales } from "../../utils/scales";
import { createRoundedTopBarPath } from "../../utils/shapes";
import styles from "./BarSeries.module.scss";

interface BarSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
  color?: string;
  hideCursor?: boolean;
  label?: string;
}

export function BarSeries<T>({
  data: localData,
  x: localX,
  y: localY,
  color,
  hideCursor,
  label,
}: BarSeriesProps<T>) {
  const {
    data: contextData,
    width,
    height,
    config,
    x: contextX,
    y: contextY,
    seriesStore,
  } = useChartContext<T>();

  const hover = useInteraction<HoverInteraction<T>>(InteractionType.HOVER);

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
      "bar",
    );
  }, [data, width, height, margin, xAccessor, yAccessor]);

  const gradientId = useId();

  useEffect(() => {
    registerSeries(seriesStore, gradientId, [
      {
        label: label || "Bar Series",
        color: color || "var(--primary)",
        y: yAccessor,
        hideCursor: hideCursor ?? true,
      },
    ]);
    return () => {
      unregisterSeries(seriesStore, gradientId);
    };
  }, [seriesStore, gradientId, color, yAccessor, label, hideCursor]);

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

        const isHovered = hover?.target?.data === d;
        const isDimmed = !!hover?.target && !isHovered;

        return (
          <path
            key={i}
            className={styles.bar}
            d={createRoundedTopBarPath(xVal, yVal, w, h, BAR_RADIUS)}
            style={{
              fill: fillColor,
              opacity: isDimmed ? 0.6 : 1,
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
