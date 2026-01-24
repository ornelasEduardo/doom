"use strict";

import { CurveFactory } from "d3-shape";
import React, { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import {
  removeInteraction,
  upsertInteraction,
  useInteraction,
} from "../../state/store/stores/interaction/interaction.store";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/stores/series/series.store";
import { Accessor } from "../../types";
import { HoverInteraction, InteractionType } from "../../types/interaction";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";
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

export function LineSeries<T>({
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
}: LineSeriesProps<T>) {
  const {
    data: contextData,
    width,
    height,
    config,
    x: contextX,
    y: contextY,
    interactionStore,
    resolveInteraction,
    isMobile,
    seriesStore,
  } = useChartContext<T>();

  const hover = useInteraction<HoverInteraction<T>>(InteractionType.HOVER);

  const data = localData || contextData;

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
      "line",
    );
  }, [data, width, height, margin, xAccessor, yAccessor]);

  const gradientId = useId().replace(/:/g, "");
  const strokeColor = color || "var(--primary)";

  useEffect(() => {
    registerSeries(seriesStore, gradientId, [
      {
        label: label || (config.yAxisLabel ?? "Series"),
        color: strokeColor,
        y: yAccessor,
        hideCursor: hideCursor,
      },
    ]);
    return () => {
      unregisterSeries(seriesStore, gradientId);
    };
  }, [
    seriesStore,
    gradientId,
    strokeColor,
    config.yAxisLabel,
    yAccessor,
    label,
    hideCursor,
  ]);

  const paths = useMemo(() => {
    if (!scaleCtx || !xAccessor || !yAccessor) {
      return null;
    }
    const { xScale, yScale, innerHeight } = scaleCtx;

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
  }, [scaleCtx, data, xAccessor, yAccessor, curve, config.curve]);

  if (render && scaleCtx) {
    return (
      <g
        ref={(node) => {
          if (node) {
            const selection = d3.select(node);
            render({
              g: selection,
              data,
              width,
              height,
              innerWidth: scaleCtx.innerWidth,
              innerHeight: scaleCtx.innerHeight,
              margin,
              xScale: scaleCtx.xScale,
              yScale: scaleCtx.yScale,
              x: xAccessor,
              y: yAccessor,
              config,
              colors: [color || "var(--primary)"],
              styles: {},
              gradientId: "",
              isMobile,
              interactionStore,
              resolveInteraction,
              showTooltip: (event: any, dataPoint: T) => {
                let dataPointX = 0;
                if (scaleCtx.xScale && xAccessor) {
                  dataPointX =
                    (scaleCtx.xScale as any)(xAccessor(dataPoint)) ?? 0;
                }
                const containerRect = node
                  .closest("[data-chart-container]")
                  ?.getBoundingClientRect();
                const tooltipX = event.clientX - (containerRect?.left || 0);
                const tooltipY = event.clientY - (containerRect?.top || 0);
                upsertInteraction(interactionStore, InteractionType.HOVER, {
                  pointer: { x: tooltipX, y: tooltipY, isTouch: false },
                  target: {
                    data: dataPoint,
                    coordinate: { x: dataPointX, y: tooltipY - margin.top },
                  },
                });
              },
              hideTooltip: () =>
                removeInteraction(interactionStore, InteractionType.HOVER),
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
        className={styles.path}
        d={paths.line || ""}
        style={{ stroke: strokeColor }}
      />
      {(showDots || config.showDots) && scaleCtx && xAccessor && yAccessor && (
        <g className="chart-dots">
          {data.map((d, i) => {
            const isHovered = hover?.target?.data === d;

            return (
              <SeriesPoint
                key={i}
                color={strokeColor}
                isHovered={isHovered}
                x={(scaleCtx.xScale as any)(xAccessor(d))}
                y={scaleCtx.yScale(yAccessor(d))}
              />
            );
          })}
        </g>
      )}

      {!(showDots || config.showDots) &&
        hover?.target &&
        scaleCtx &&
        xAccessor &&
        yAccessor && (
          <SeriesPoint
            color={strokeColor}
            isHovered={true}
            x={(scaleCtx.xScale as any)(xAccessor(hover.target.data))}
            y={scaleCtx.yScale(yAccessor(hover.target.data))}
          />
        )}
    </g>
  );
}

export function LineSeriesWrapper({
  className,
  style,
  ...props
}: LineSeriesProps<any>) {
  const { config } = useChartContext();
  return (
    <g
      className={className}
      style={style}
      transform={`translate(${config.margin.left}, ${config.margin.top})`}
    >
      <LineSeries {...props} />
    </g>
  );
}
