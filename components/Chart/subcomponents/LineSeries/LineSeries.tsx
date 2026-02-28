"use strict";

import { CurveFactory } from "d3-shape";
import React, { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { Accessor } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { SeriesPoint } from "../SeriesPoint/SeriesPoint";
import styles from "./LineSeries.module.scss";

interface LineSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  curve?: CurveFactory;
  showDots?: boolean;
  render?: (ctx: any) => void;
  label?: string;
  type?: "line" | "area";
  hideCursor?: boolean;
}

const LineSeriesComponent = <T,>({
  data: localData,
  x: localX,
  y: localY,
  color,
  curve,
  showDots,
  render,
  label,
  type,
  hideCursor,
}: LineSeriesProps<T>) => {
  const {
    chartStore,
    config,
    x: contextX,
    y: contextY,
    isMobile,
  } = useChartContext<T>();

  const data = chartStore.useStore((s) => localData || s.data);
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const xScale = chartStore.useStore((s) => s.scales.x);
  const yScale = chartStore.useStore((s) => s.scales.y);
  const margin = chartStore.useStore((s) => s.dimensions.margin);
  const innerHeight = chartStore.useStore((s) => s.dimensions.innerHeight);

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

  const gradientId = useId().replace(/:/g, "");
  const strokeColor = color || "var(--primary)";

  useEffect(() => {
    if (!yAccessor) {
      return;
    }
    registerSeries(chartStore, gradientId, [
      {
        id: gradientId,
        label: label || (config.yAxisLabel ?? "Series"),
        color: strokeColor,
        x: xAccessor,
        y: yAccessor,
        hideCursor: hideCursor,
      },
    ]);
    return () => {
      unregisterSeries(chartStore, gradientId);
    };
  }, [
    chartStore,
    gradientId,
    strokeColor,
    config.yAxisLabel,
    yAccessor,
    xAccessor,
    label,
    hideCursor,
    data,
  ]);

  const paths = useMemo(() => {
    if (
      !xScale ||
      !yScale ||
      !xAccessor ||
      !yAccessor ||
      dimensions.width <= 0 ||
      dimensions.height <= 0 ||
      !data ||
      data.length === 0
    ) {
      return null;
    }

    const lineGenerator = d3
      .line<T>()
      .x((d) => (xScale as any)(xAccessor(d)) ?? 0)
      .y((d) => yScale(yAccessor(d)))
      .curve(curve || config.curve || d3.curveLinear);

    const areaGenerator = d3
      .area<T>()
      .x((d) => (xScale as any)(xAccessor(d)) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(yAccessor(d)))
      .curve(curve || config.curve || d3.curveLinear);

    return {
      line: lineGenerator(data),
      area: areaGenerator(data),
    };
  }, [
    xScale,
    yScale,
    data,
    xAccessor,
    yAccessor,
    curve,
    config.curve,
    dimensions.width,
    dimensions.height,
  ]);

  if (render && xScale && yScale) {
    return (
      <g
        ref={(node) => {
          if (node) {
            const selection = d3.select(node);
            render({
              g: selection,
              data,
              height: dimensions.height,
              innerWidth: dimensions.innerWidth,
              innerHeight: dimensions.innerHeight,
              margin,
              xScale,
              yScale,
              x: xAccessor,
              y: yAccessor,
              config,
              colors: [color || "var(--primary)"],
              styles: {},
              gradientId,
              isMobile,
              chartStore,
              seriesId: gradientId,
              chartDataAttrs: CHART_DATA_ATTRS,
            } as any);
          }
        }}
      />
    );
  }

  if (!paths) {
    return null;
  }

  const isArea = type === "area" || config.type === "area";
  const showGradient = isArea && config.withGradient !== false;

  return (
    <g className="chart-line-series">
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}

      {showGradient && (
        <path
          className={styles.area}
          d={paths.area || ""}
          style={{
            fill: `url(#${gradientId})`,
          }}
        />
      )}
      <path
        aria-label={label || "Line Series"}
        aria-roledescription="line"
        className={styles.path}
        d={paths.line || ""}
        role="graphics-object"
        style={{ stroke: strokeColor }}
        {...{
          [CHART_DATA_ATTRS.TYPE]: "line",
          [CHART_DATA_ATTRS.SERIES_ID]: gradientId,
          [CHART_DATA_ATTRS.DRAGGABLE]: false,
        }}
      />

      {(showDots || config.showDots) &&
        xScale &&
        yScale &&
        yAccessor &&
        xAccessor &&
        data.map((d, i) => {
          const cx = (xScale as any)(xAccessor(d));
          const cy = yScale(yAccessor(d));
          return (
            <SeriesPoint key={i} color={strokeColor} datum={d} x={cx} y={cy} />
          );
        })}
    </g>
  );
};

export const LineSeries = React.memo(
  LineSeriesComponent,
) as typeof LineSeriesComponent;

export function LineSeriesWrapper({
  className,
  style,
  ...props
}: LineSeriesProps<any>) {
  return (
    <g className={className} style={style}>
      <LineSeries {...props} />
    </g>
  );
}
