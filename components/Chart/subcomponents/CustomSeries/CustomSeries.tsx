import React, { useEffect, useId, useRef } from "react";

import { useChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { SeriesProps } from "../../types";
import { D3Selection } from "../../types/selection";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";

const CustomSeriesComponent = <T,>(props: SeriesProps<T>) => {
  const { chartStore, config, isMobile, resolveInteraction } =
    useChartContext<T>();

  const stateData = chartStore.useStore((s) => s.data);
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const scales = chartStore.useStore((s) => s.scales);

  const { data: localData, x: localX, y: localY, render, color, label } = props;
  const { innerWidth, innerHeight } = dimensions;

  // Determine effective data and accessors
  const data = localData || stateData;
  const xAccessor = localX ? resolveAccessor(localX) : undefined;
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
        xAccessor,
        hideCursor: true,
        interactionMode: "x",
        data,
        id: seriesId,
      } as any,
    ]);

    return () => {
      unregisterSeries(chartStore, seriesId);
    };
  }, [
    chartStore,
    seriesId,
    label,
    config.yAxisLabel,
    color,
    yAccessor,
    xAccessor,
    data,
  ]);

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
    container.datum(data as any);

    render({
      container,
      data,
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
      resolveInteraction,
      seriesId,
      chartDataAttrs: CHART_DATA_ATTRS,
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
    resolveInteraction,
  ]);

  if (!render) {
    return null;
  }

  return <g ref={gRef} />;
};

export const CustomSeries = React.memo(
  CustomSeriesComponent,
) as typeof CustomSeriesComponent;
