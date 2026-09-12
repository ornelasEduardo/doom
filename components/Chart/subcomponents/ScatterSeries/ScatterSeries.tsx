"use strict";

import React, { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { Accessor, AxisValue } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { describeDatum } from "../../utils/describe";
import { useSeriesColor } from "../../utils/hooks";
import { numericSample, samplePosition } from "../../utils/sampleValidity";
import { SeriesPoint } from "../SeriesPoint/SeriesPoint";

interface ScatterSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, AxisValue>;
  y?: Accessor<T, AxisValue>;
  size?: Accessor<T, number>;
  color?: string;
  label?: string;
  hideCursor?: boolean;
}

const ScatterSeriesComponent = <T,>({
  data: localData,
  x: localX,
  y: localY,
  size: localSize,
  color,
  label,
  hideCursor,
}: ScatterSeriesProps<T>) => {
  const { chartStore, x: contextX, y: contextY } = useChartContext<T>();

  const data = chartStore.useStore((s) => localData || s.data);
  const xScale = chartStore.useStore((s) => s.scales.x);
  const yScale = chartStore.useStore((s) => s.scales.y);

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
  const sizeAccessor = useMemo(
    () => (localSize ? resolveAccessor(localSize) : undefined),
    [localSize],
  );

  const rScale = useMemo(() => {
    if (!data.length || !sizeAccessor) {
      return null;
    }
    const sizes = data.flatMap((datum) => {
      if (datum == null) {
        return [];
      }
      const size = numericSample(sizeAccessor(datum));
      return size === undefined || size < 0 ? [] : [size];
    });
    const maxVal = Math.max(0, ...sizes);
    // Use sqrt scale for circular area sizing (area ~ value)
    return (val: number) => {
      const normalized = Math.sqrt(val) / Math.sqrt(maxVal || 1);
      return 4 + normalized * 16;
    };
  }, [data, sizeAccessor]);

  const seriesId = useId();
  const strokeColor = useSeriesColor(chartStore, seriesId, color);

  useEffect(() => {
    if (!yAccessor) {
      unregisterSeries(chartStore, seriesId);
      return;
    }
    registerSeries(chartStore, seriesId, [
      {
        id: seriesId,
        label: label || "Scatter Series",
        color,
        data: localData,
        x: xAccessor,
        y: yAccessor,
        hideCursor: hideCursor ?? true,
        interactionMode: "xy",
      } as any,
    ]);
  }, [
    chartStore,
    seriesId,
    color,
    yAccessor,
    xAccessor,
    label,
    hideCursor,
    localData,
    data,
  ]);

  useEffect(
    () => () => unregisterSeries(chartStore, seriesId),
    [chartStore, seriesId],
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

  return (
    <g className="chart-scatter-series">
      {data.map((d, i) => {
        const position = samplePosition(
          d,
          xAccessor,
          yAccessor,
          xScale,
          yScale,
        );
        if (!position) {
          return null;
        }

        let radius = 6;
        if (rScale && sizeAccessor) {
          const size = numericSample(sizeAccessor(d));
          if (size !== undefined && size >= 0) {
            radius = rScale(size);
          }
        }

        return (
          <SeriesPoint
            key={i}
            color={strokeColor}
            datum={d}
            description={describeDatum(d, xAccessor, yAccessor)}
            hoverRadius={radius + 4}
            radius={radius}
            x={position.x}
            y={position.y}
            {...{
              [CHART_DATA_ATTRS.TYPE]: "scatter",
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

export const ScatterSeries = React.memo(
  ScatterSeriesComponent,
) as typeof ScatterSeriesComponent;

export function ScatterSeriesWrapper(props: ScatterSeriesProps<any>) {
  return (
    <g>
      <ScatterSeries {...props} />
    </g>
  );
}
