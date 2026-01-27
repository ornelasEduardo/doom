"use strict";

import React, { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import {
  registerSeries,
  unregisterSeries,
} from "../../state/store/chart.store";
import { Accessor } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { SeriesPoint } from "../SeriesPoint/SeriesPoint";

interface ScatterSeriesProps<T> {
  data?: T[];
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
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
    const maxVal = Math.max(
      ...data.map((d) => (sizeAccessor(d) as number) || 0),
    );
    // Use sqrt scale for circular area sizing (area ~ value)
    return (val: number) => {
      const normalized = Math.sqrt(val) / Math.sqrt(maxVal || 1);
      return 4 + normalized * 16;
    };
  }, [data, sizeAccessor]);

  const seriesId = useId();
  const strokeColor = color || "var(--primary)";

  useEffect(() => {
    if (!yAccessor) {
      return;
    }
    registerSeries(chartStore, seriesId, [
      {
        label: label || "Scatter Series",
        color: strokeColor,
        x: xAccessor,
        y: yAccessor,
        hideCursor: hideCursor ?? true,
        interactionMode: "xy",
      } as any,
    ]);
    return () => {
      unregisterSeries(chartStore, seriesId);
    };
  }, [
    chartStore,
    seriesId,
    strokeColor,
    yAccessor,
    xAccessor,
    label,
    hideCursor,
    data,
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

  return (
    <g className="chart-scatter-series">
      {data.map((d, i) => {
        const cx = (xScale as any)(xAccessor(d));
        const cy = yScale(yAccessor(d));

        let radius = 6;
        if (rScale && sizeAccessor) {
          radius = rScale(sizeAccessor(d));
        }

        return (
          <SeriesPoint
            key={i}
            color={strokeColor}
            data-index={i}
            datum={d}
            hoverRadius={radius + 4}
            radius={radius}
            x={cx}
            y={cy}
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
