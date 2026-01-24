import { useEffect, useId, useMemo, useRef } from "react";

import { useChartContext } from "../../context";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/stores/series/series.store";
import { SeriesProps } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";

export function CustomSeries<T>(props: SeriesProps<T>) {
  const {
    data: contextData,
    width,
    height,
    config,
    x: contextX,
    y: contextY,
    setHoverState,
    resolveInteraction,
    isMobile,
    seriesStore,
  } = useChartContext<T>();

  const { data: localData, x: localX, y: localY, render, color, label } = props;
  const { margin } = config;

  // Determine effective data and accessors
  const data = localData || contextData;
  const xAccessor =
    (localX ? resolveAccessor(localX) : undefined) ||
    (contextX ? resolveAccessor(contextX) : undefined);
  const yAccessor =
    (localY ? resolveAccessor(localY) : undefined) ||
    (contextY ? resolveAccessor(contextY) : undefined);

  const scaleCtx = useMemo(() => {
    if (!data.length || width <= 0 || height <= 0) {
      return null;
    }
    if (xAccessor && yAccessor) {
      return createScales(
        data,
        width,
        height,
        margin,
        xAccessor,
        yAccessor,
        "line",
      );
    }
    return {
      xScale: d3.scaleLinear(),
      yScale: d3.scaleLinear(),
      innerWidth: width - margin.left - margin.right,
      innerHeight: height - margin.top - margin.bottom,
    };
  }, [data, width, height, margin, xAccessor, yAccessor]);

  const gRef = useRef<SVGGElement>(null);
  const seriesId = useId();

  // Register CustomSeries so it appears in the Legend
  useEffect(() => {
    if (!seriesStore) {
      return;
    }

    // Only register if we have a label or yAxisLabel to show
    const effectiveLabel = label || config.yAxisLabel || "Series";

    registerSeries(seriesStore, seriesId, [
      {
        label: effectiveLabel,
        color: color || "var(--primary)",
        y: yAccessor,
        hideCursor: true, // Custom series usually handle their own interaction or don't use standard cursor
        interactionMode: "x",
      } as any,
    ]); // Cast to any to allow interactionMode which might not be in generic SeriesProps yet

    return () => {
      unregisterSeries(seriesStore, seriesId);
    };
  }, [seriesStore, seriesId, label, config.yAxisLabel, color, yAccessor]);

  useEffect(() => {
    if (!render || !gRef.current || !data.length || width <= 0 || height <= 0) {
      return;
    }

    const selection = d3.select(gRef.current);

    const showTooltip = (event: any, dataPoint: T) => {
      // Logic from CartesianHover essentially, but manual triggering
      // We need to calculate positions.
      // Simplification: Use event coordinates.
      const clientX = event.clientX;
      const clientY = event.clientY;
      const containerRect = gRef.current
        ?.closest("[data-chart-container]")
        ?.getBoundingClientRect();

      const tooltipX = clientX - (containerRect?.left || 0);
      const tooltipY = clientY - (containerRect?.top || 0);

      // For cursor line, we'd need scales.
      // Let's pass sensible defaults or calculated if scales exist.
      let cursorLineX = 0;
      if (scaleCtx?.xScale && xAccessor) {
        cursorLineX = (scaleCtx.xScale as any)(xAccessor(dataPoint)) ?? 0;
        cursorLineX += margin.left;
      }

      if (setHoverState) {
        setHoverState({
          cursorLineX,
          cursorLineY: tooltipY,
          tooltipX,
          tooltipY,
          data: dataPoint,
          isTouch: event.type === "touchmove" || event.type === "touchstart",
        });
      }
    };

    const hideTooltip = () => {
      if (setHoverState) {
        setHoverState(null);
      }
    };

    render({
      g: selection,
      data,
      width,
      height,
      innerWidth: scaleCtx?.innerWidth ?? width - margin.left - margin.right,
      innerHeight: scaleCtx?.innerHeight ?? height - margin.top - margin.bottom,
      margin,
      xScale: scaleCtx?.xScale,
      yScale: scaleCtx?.yScale,
      x: xAccessor,
      y: yAccessor,
      config,
      colors: [color || "var(--primary)"],
      styles: {},
      gradientId: "",
      isMobile,
      setHoverState: setHoverState!,
      resolveInteraction: resolveInteraction!,
      showTooltip,
      hideTooltip,
    } as any);
  }, [
    render,
    data,
    width,
    height,
    margin,
    scaleCtx,
    xAccessor,
    yAccessor,
    config,
    color,
    isMobile,
    setHoverState,
    resolveInteraction,
  ]);

  if (!render) {
    return null;
  }

  return (
    <g ref={gRef} transform={`translate(${margin.left}, ${margin.top})`} />
  );
}
