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
import {
  createCustomGeometry,
  CustomGeometry,
} from "../../utils/customGeometry";
import { d3 } from "../../utils/d3";
import { useSeriesColor } from "../../utils/hooks";

const CustomSeriesComponent = <T,>(props: SeriesProps<T>) => {
  const { chartStore, engine, config, isMobile, resolveInteraction } =
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
  const geometryRef = useRef<CustomGeometry<T> | null>(null);
  const hasRender = Boolean(render);

  useEffect(() => {
    if (!gRef.current) {
      return;
    }
    const geometry = createCustomGeometry(engine, gRef.current, seriesId);
    geometryRef.current = geometry;
    return () => {
      geometryRef.current = null;
      geometry.dispose();
    };
  }, [engine, seriesId, hasRender]);
  const seriesColor = useSeriesColor(chartStore, seriesId, color);

  // Register CustomSeries so it appears in the Legend
  useEffect(() => {
    // Only register if we have a label or yAxisLabel to show
    const effectiveLabel = label || config.yAxisLabel || "Series";

    registerSeries(chartStore, seriesId, [
      {
        label: effectiveLabel,
        type: "custom",
        color,
        data: localData,
        y: yAccessor,
        x: xAccessor,
        hideCursor: true,
        interactionMode: "x",
        id: seriesId,
      },
    ]);
  }, [
    chartStore,
    seriesId,
    label,
    config.yAxisLabel,
    color,
    yAccessor,
    xAccessor,
    localData,
    data,
  ]);

  useEffect(
    () => () => unregisterSeries(chartStore, seriesId),
    [chartStore, seriesId],
  );

  useEffect(() => {
    if (
      !render ||
      !gRef.current ||
      !geometryRef.current ||
      dimensions.width <= 0 ||
      dimensions.height <= 0
    ) {
      return;
    }

    const container = d3
      .select(gRef.current)
      .datum(data) as unknown as D3Selection<T>;

    // Empty frames must clear both the custom DOM join and owned hit geometry.
    if (data.length === 0) {
      geometryRef.current.update([]);
    }
    render({
      geometry: geometryRef.current,
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
        colors: [seriesColor],
        isMobile,
      },
      config,
      resolveInteraction,
      seriesId,
      chartDataAttrs: CHART_DATA_ATTRS,
    });
  }, [
    engine,
    seriesId,
    seriesColor,
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
