import { useEffect, useId, useMemo, useRef } from "react";

import { useChartContext } from "../../context";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/stores/series/series.store";
import { SeriesProps } from "../../types";
import { D3Selection } from "../../types/selection";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";

export function CustomSeries<T>(props: SeriesProps<T>) {
  const {
    data: contextData,
    width,
    height,
    config,
    isMobile,
    seriesStore,
  } = useChartContext<T>();

  const { data: localData, x: localX, y: localY, render, color, label } = props;
  const { margin } = config;

  // Determine effective data and accessors
  const data = localData || contextData;
  const xAccessor = localX ? resolveAccessor(localX) : undefined;
  const yAccessor = localY ? resolveAccessor(localY) : undefined;

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

    const container = d3.select(gRef.current) as unknown as D3Selection<T>;

    render({
      container,
      size: {
        width: scaleCtx?.innerWidth ?? width - margin.left - margin.right,
        height: scaleCtx?.innerHeight ?? height - margin.top - margin.bottom,
        radius: Math.min(width, height) / 2,
      },
      scales: {
        x: scaleCtx?.xScale,
        y: scaleCtx?.yScale,
      },
      theme: {
        colors: [color || "var(--primary)"],
        isMobile,
      },
      config,
    });
  }, [render, data, width, height, margin, scaleCtx, config, color, isMobile]);

  if (!render) {
    return null;
  }

  return (
    <g ref={gRef} transform={`translate(${margin.left}, ${margin.top})`} />
  );
}
