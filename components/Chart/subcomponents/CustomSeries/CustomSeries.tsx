import React, { useEffect, useId, useRef } from "react";

import { useChartContext } from "../../context";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { SeriesProps } from "../../types";
import { D3Selection } from "../../types/selection";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";

const CustomSeriesComponent = <T,>(props: SeriesProps<T>) => {
  const { chartStore, config, isMobile } = useChartContext<T>();

  const {
    data: stateData,
    dimensions,
    scales,
  } = chartStore.useStore((s) => ({
    data: s.data,
    dimensions: s.dimensions,
    scales: s.scales,
  }));

  const { data: localData, x: localX, y: localY, render, color, label } = props;
  const { margin, innerWidth, innerHeight } = dimensions;

  // Determine effective data and accessors
  const data = localData || stateData;
  const yAccessor = localY ? resolveAccessor(localY) : undefined;

  const gRef = useRef<SVGGElement>(null);
  const seriesId = useId();

  // Register CustomSeries so it appears in the Legend
  useEffect(() => {
    // Only register if we have a label or yAxisLabel to show
    const effectiveLabel = label || config.yAxisLabel || "Series";

    registerSeries(chartStore, seriesId, [
      {
        label: effectiveLabel,
        color: color || "var(--primary)",
        yAccessor,
        hideCursor: true, // Custom series usually handle their own interaction or don't use standard cursor
        interactionMode: "x",
      } as any,
    ]);

    return () => {
      unregisterSeries(chartStore, seriesId);
    };
  }, [chartStore, seriesId, label, config.yAxisLabel, color, yAccessor]);

  useEffect(() => {
    if (
      !render ||
      !gRef.current ||
      !data.length ||
      dimensions.width <= 0 ||
      dimensions.height <= 0
    ) {
      return;
    }

    const container = d3.select(gRef.current) as unknown as D3Selection<T>;

    render({
      container,
      size: {
        width: innerWidth,
        height: innerHeight,
        radius: Math.min(innerWidth, innerHeight) / 2,
      },
      scales: {
        x: scales.x ?? undefined,
        y: scales.y ?? undefined,
      },
      theme: {
        colors: [color || "var(--primary)"],
        isMobile,
      },
      config,
    });
  }, [
    render,
    data,
    dimensions,
    scales,
    config,
    color,
    isMobile,
    innerWidth,
    innerHeight,
  ]);

  if (!render) {
    return null;
  }

  return (
    <g ref={gRef} transform={`translate(${margin.left}, ${margin.top})`} />
  );
};

export const CustomSeries = React.memo(
  CustomSeriesComponent,
) as typeof CustomSeriesComponent;
