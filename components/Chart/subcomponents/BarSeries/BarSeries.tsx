"use strict";

import React, { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { selectChartOrientation } from "../../state/store/slices/series.slice";
import { Accessor, SeriesOrientation } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { createRoundedBarPath } from "../../utils/shapes";
import styles from "./BarSeries.module.scss";

interface BarSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number | string>;
  color?: string;
  hideCursor?: boolean;
  label?: string;
  orientation?: SeriesOrientation;
}

const BAR_RADIUS = 4;
const POINT_SCALE_BAND_FRACTION = 0.8;

function resolveBandwidth(scale: any): { width: number; offset: number } {
  if ("bandwidth" in scale && typeof scale.bandwidth === "function") {
    const w = scale.bandwidth();
    if (w === 0 && "step" in scale) {
      const stepWidth = scale.step() * POINT_SCALE_BAND_FRACTION;
      return { width: stepWidth, offset: stepWidth / 2 };
    }
    return { width: w, offset: 0 };
  }
  if ("step" in scale) {
    const stepWidth = scale.step() * POINT_SCALE_BAND_FRACTION;
    return { width: stepWidth, offset: stepWidth / 2 };
  }
  return { width: 10, offset: 0 };
}

const BarSeriesComponent = <T,>({
  data: localData,
  x: localX,
  y: localY,
  color,
  hideCursor,
  label,
  orientation,
}: BarSeriesProps<T>) => {
  const { chartStore, x: contextX, y: contextY } = useChartContext<T>();

  const data = chartStore.useStore((s) => localData || s.data);
  const xScale = chartStore.useStore((s) => s.scales.x);
  const yScale = chartStore.useStore((s) => s.scales.y);
  const innerHeight = chartStore.useStore((s) => s.dimensions.innerHeight);
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const chartOrientation = chartStore.useStore(selectChartOrientation);

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

  const seriesId = useId();

  useEffect(() => {
    if (!yAccessor) {
      return;
    }
    registerSeries(chartStore, seriesId, [
      {
        id: seriesId,
        label: label || "Bar Series",
        color: color || "var(--primary)",
        x: xAccessor,
        y: yAccessor,
        hideCursor: hideCursor ?? true,
        type: "bar",
        orientation,
        data,
      },
    ]);
    return () => {
      unregisterSeries(chartStore, seriesId);
    };
  }, [
    chartStore,
    seriesId,
    color,
    yAccessor,
    xAccessor,
    label,
    hideCursor,
    data,
    orientation,
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

  const fillColor = color || "var(--primary)";
  const isHorizontal = chartOrientation === "horizontal";

  return (
    <g className="chart-bar-series">
      {data.map((d, i) => {
        let pathX: number;
        let pathY: number;
        let pathW: number;
        let pathH: number;

        if (isHorizontal) {
          const categoryPos = (yScale as any)(yAccessor(d)) ?? 0;
          const valuePixel = (xScale as any)(xAccessor(d)) ?? 0;
          const { width: bandwidth, offset } = resolveBandwidth(yScale);

          pathX = 0;
          pathY = categoryPos - offset;
          pathW = valuePixel;
          pathH = bandwidth;
        } else {
          const categoryPos = (xScale as any)(xAccessor(d)) ?? 0;
          const valuePixel = (yScale as any)(yAccessor(d)) ?? 0;
          const { width: bandwidth, offset } = resolveBandwidth(xScale);

          pathX = categoryPos - offset;
          pathY = valuePixel;
          pathW = bandwidth;
          pathH = innerHeight - valuePixel;
        }

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
            d={createRoundedBarPath(
              pathX,
              pathY,
              pathW,
              pathH,
              BAR_RADIUS,
              isHorizontal ? "right" : "top",
            )}
            role="graphics-symbol"
            style={{
              fill: fillColor,
              pointerEvents: "all",
            }}
            {...{
              [CHART_DATA_ATTRS.TYPE]: "bar",
              [CHART_DATA_ATTRS.SERIES_ID]: seriesId,
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
