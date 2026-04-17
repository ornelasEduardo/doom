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
import { getStackOffset } from "../../utils/stack";
import styles from "./BarSeries.module.scss";

interface BarSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number | string>;
  color?: string;
  hideCursor?: boolean;
  label?: string;
  orientation?: SeriesOrientation;
  /**
   * Bar thickness perpendicular to value growth (width in vertical mode,
   * height in horizontal mode). "auto" fills the band; a number renders
   * a fixed-pixel bar centered within the band — useful for overlay
   * patterns like target-vs-actual where one series sits inside another.
   */
  barWidth?: number | "auto";
  /**
   * Groups bar series into a stack. Series sharing a stackId render
   * stacked on top of each other in registration order.
   */
  stackId?: string;
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
  barWidth = "auto",
  stackId,
}: BarSeriesProps<T>) => {
  const { chartStore, x: contextX, y: contextY } = useChartContext<T>();

  const data = chartStore.useStore((s) => localData || s.data);
  const xScale = chartStore.useStore((s) => s.scales.x);
  const yScale = chartStore.useStore((s) => s.scales.y);
  const innerHeight = chartStore.useStore((s) => s.dimensions.innerHeight);
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const chartOrientation = chartStore.useStore(selectChartOrientation);
  const processedSeries = chartStore.useStore((s) => s.processedSeries);

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
        stackId,
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
    stackId,
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
  const ownSeries = processedSeries.find((s) => s.id === seriesId);

  const seriesAboveInStack = ownSeries?.stackId
    ? processedSeries
        .slice(processedSeries.findIndex((s) => s.id === ownSeries.id) + 1)
        .filter((s) => s.stackId === ownSeries.stackId)
    : [];

  const isVisualTopForDatum = (datum: any) => {
    if (seriesAboveInStack.length === 0) {
      return true;
    }
    if (!ownSeries?.categoryAccessor) {
      return true;
    }
    const categoryAccessor = resolveAccessor(ownSeries.categoryAccessor);
    const datumCategory = categoryAccessor(datum);

    return !seriesAboveInStack.some((s) => {
      if (!s.data || !s.valueAccessor || !s.categoryAccessor) {
        return false;
      }
      const otherCategoryAccessor = resolveAccessor(s.categoryAccessor);
      const otherValueAccessor = resolveAccessor(s.valueAccessor);
      const match = s.data.find(
        (d) => otherCategoryAccessor(d) === datumCategory,
      );
      if (!match) {
        return false;
      }
      const v = otherValueAccessor(match);
      return typeof v === "number" && v > 0;
    });
  };

  return (
    <g className="chart-bar-series">
      {data.map((d, i) => {
        let pathX: number;
        let pathY: number;
        let pathW: number;
        let pathH: number;

        const stackOffset = ownSeries
          ? getStackOffset(ownSeries, d, processedSeries)
          : 0;

        if (isHorizontal) {
          const categoryPos = (yScale as any)(yAccessor(d)) ?? 0;
          const datumValue = (xAccessor(d) as number) ?? 0;
          const startPixel = (xScale as any)(stackOffset) ?? 0;
          const endPixel = (xScale as any)(stackOffset + datumValue) ?? 0;
          const { width: bandwidth, offset } = resolveBandwidth(yScale);
          const thickness =
            barWidth === "auto" ? bandwidth : Math.min(barWidth, bandwidth);
          const centerOffset = (bandwidth - thickness) / 2;

          pathX = startPixel;
          pathY = categoryPos - offset + centerOffset;
          pathW = endPixel - startPixel;
          pathH = thickness;
        } else {
          const categoryPos = (xScale as any)(xAccessor(d)) ?? 0;
          const datumValue = (yAccessor(d) as number) ?? 0;
          const topPixel = (yScale as any)(stackOffset + datumValue) ?? 0;
          const baselinePixel = (yScale as any)(stackOffset) ?? innerHeight;
          const { width: bandwidth, offset } = resolveBandwidth(xScale);
          const thickness =
            barWidth === "auto" ? bandwidth : Math.min(barWidth, bandwidth);
          const centerOffset = (bandwidth - thickness) / 2;

          pathX = categoryPos - offset + centerOffset;
          pathY = topPixel;
          pathW = thickness;
          pathH = baselinePixel - topPixel;
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
              isVisualTopForDatum(d) ? BAR_RADIUS : 0,
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
