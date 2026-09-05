"use client";

import React, { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { Accessor } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { barGeometry } from "../../utils/bars";
import { describeDatum } from "../../utils/describe";
import { useSeriesColor } from "../../utils/hooks";
import { createBarPath } from "../../utils/shapes";
import styles from "./BarSeries.module.scss";

interface BarSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, string | number>;
  orientation?: "vertical" | "horizontal";
  barWidth?: number | "auto";
  stackId?: string;
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
  orientation,
  barWidth = "auto",
  stackId,
}: BarSeriesProps<T>) => {
  const { chartStore, config, x: contextX, y: contextY } = useChartContext<T>();

  const data = chartStore.useStore((s) => localData || s.data);
  const xScale = chartStore.useStore((s) => s.scales.x);
  const yScale = chartStore.useStore((s) => s.scales.y);
  const series = chartStore.useStore((s) => s.processedSeries);

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
  const fillColor = useSeriesColor(chartStore, gradientId, color);
  const isRegistered = chartStore.useStore(
    (s) => s.seriesConfigs?.has(gradientId) ?? false,
  );

  useEffect(() => {
    if (!yAccessor) {
      return;
    }
    registerSeries(chartStore, gradientId, [
      {
        id: gradientId,
        label: label || "Bar Series",
        color,
        data: localData,
        x: xAccessor,
        y: yAccessor,
        hideCursor: hideCursor ?? true,
        type: "bar",
        orientation,
        barWidth,
        stackId,
      },
    ]);
  }, [
    chartStore,
    gradientId,
    color,
    yAccessor,
    xAccessor,
    label,
    hideCursor,
    data,
    localData,
    orientation,
    barWidth,
    stackId,
  ]);

  useEffect(
    () => () => unregisterSeries(chartStore, gradientId),
    [chartStore, gradientId],
  );

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

  return (
    <g className="chart-bar-series">
      {data.map((d, i) => {
        const registered = series.find((item) => item.id === gradientId);
        if (isRegistered && !registered) {
          return null;
        }
        const effectiveOrientation =
          registered?.orientation ?? orientation ?? "vertical";
        const geometry = barGeometry(
          registered ?? {
            id: gradientId,
            label: label ?? "Bar Series",
            color: fillColor,
            type: "bar",
            xAccessor,
            yAccessor,
            orientation,
            barWidth,
          },
          d,
          i,
          xScale,
          yScale,
        );
        if (!geometry) {
          return null;
        }
        const { x: finalX, y: finalY, width: w, height: h } = geometry;
        const negative =
          Number(
            effectiveOrientation === "horizontal" ? xAccessor(d) : yAccessor(d),
          ) < 0;
        const end =
          effectiveOrientation === "horizontal"
            ? negative
              ? "left"
              : "right"
            : negative
              ? "bottom"
              : "top";
        const radius = registered?.stackEnds?.[i] === false ? 0 : BAR_RADIUS;

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
                ? `${label}: ${describeDatum(d, effectiveOrientation === "horizontal" ? yAccessor : xAccessor, effectiveOrientation === "horizontal" ? xAccessor : yAccessor)}`
                : describeDatum(
                    d,
                    effectiveOrientation === "horizontal"
                      ? yAccessor
                      : xAccessor,
                    effectiveOrientation === "horizontal"
                      ? xAccessor
                      : yAccessor,
                  ) || "Bar"
            }
            aria-roledescription="bar"
            className={`${styles.bar} chart-bar`}
            d={createBarPath(finalX, finalY, w, h, end, radius)}
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
