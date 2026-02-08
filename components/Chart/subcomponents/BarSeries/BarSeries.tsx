"use strict";

import React, { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { Accessor } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
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

const BarSeriesComponent = <T,>({
  data: localData,
  x: localX,
  y: localY,
  color,
  hideCursor,
  label,
}: BarSeriesProps<T>) => {
  const { chartStore, config, x: contextX, y: contextY } = useChartContext<T>();

  const data = chartStore.useStore((s) => localData || s.data);
  const xScale = chartStore.useStore((s) => s.scales.x);
  const yScale = chartStore.useStore((s) => s.scales.y);
  const innerHeight = chartStore.useStore((s) => s.dimensions.innerHeight);

  const dimensions = chartStore.useStore((s) => s.dimensions);

  const xAccessor = useMemo(
    () =>
      (localX ? resolveAccessor(localX) : undefined) ||
      (contextX ? resolveAccessor(contextX) : undefined),
    [localX, contextX],
  );

  const yAccessor = useMemo(
    () =>
      (localY ? resolveAccessor(localY) : undefined) ||
      (contextY ? resolveAccessor(contextY) : undefined),
    [localY, contextY],
  );

  const gradientId = useId();

  useEffect(() => {
    if (!yAccessor) {
      return;
    }
    registerSeries(chartStore, gradientId, [
      {
        id: gradientId,
        label: label || "Bar Series",
        color: color || "var(--primary)",
        x: xAccessor,
        y: yAccessor,
        hideCursor: hideCursor ?? true,
        type: "bar",
        data,
      },
    ]);
    return () => {
      unregisterSeries(chartStore, gradientId);
    };
  }, [
    chartStore,
    gradientId,
    color,
    yAccessor,
    xAccessor,
    label,
    hideCursor,
    data,
  ]);

  if (
    !xScale ||
    !yScale ||
    !xAccessor ||
    !yAccessor ||
    dimensions.width <= 0 ||
    dimensions.height <= 0
  ) {
    return null;
  }

  const BAR_RADIUS = 4;
  const fillColor = color || "var(--primary)";

  return (
    <g className="chart-bar-series">
      {data.map((d, i) => {
        const xPos = (xScale as any)(xAccessor(d)) ?? 0;
        const yVal = yScale(yAccessor(d));
        let w = 10;
        let offset = 0;

        if ("bandwidth" in xScale && typeof xScale.bandwidth === "function") {
          w = xScale.bandwidth();
          if (w === 0 && "step" in xScale) {
            // Fallback for ScalePoint (bandwidth=0) -> use 80% of step
            w = (xScale as any).step() * 0.8;
            offset = w / 2;
          }
        } else if ("step" in xScale) {
          w = (xScale as any).step() * 0.8;
          offset = w / 2;
        }

        const finalX = xPos - offset;

        const h = innerHeight - yVal;

        return (
          <path
            key={i}
            ref={(node) => {
              if (node) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (node as any).__data__ = d;
              }
            }}
            aria-label={
              label
                ? `${label}: ${JSON.stringify(d)}`
                : `Bar: ${JSON.stringify(d)}`
            }
            aria-roledescription="bar"
            className={`${styles.bar} chart-bar`}
            d={createRoundedTopBarPath(finalX, yVal, w, h, BAR_RADIUS)}
            role="graphics-symbol"
            style={{
              fill: fillColor,
              pointerEvents: "all",
            }}
            {...{
              [CHART_DATA_ATTRS.TYPE]: "bar",
              [CHART_DATA_ATTRS.SERIES_ID]: gradientId,
              [CHART_DATA_ATTRS.INDEX]: i,
              [CHART_DATA_ATTRS.DRAGGABLE]: false,
            }}
          />
        );
      })}
    </g>
  );
};

export const BarSeries = React.memo(
  BarSeriesComponent,
) as typeof BarSeriesComponent;

export function BarSeriesWrapper(props: BarSeriesProps<any>) {
  return (
    <g>
      <BarSeries {...props} />
    </g>
  );
}
