"use strict";

import { useMemo } from "react";

import { useChartContext } from "../../context";
import { useInteraction } from "../../state/store/stores/interaction/interaction.store";
import { Accessor } from "../../types";
import { HoverInteraction, InteractionType } from "../../types/interaction";
import { resolveAccessor } from "../../utils/accessors";
import { useSeriesRegistration } from "../../utils/hooks";
import { createScales } from "../../utils/scales";
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

/**
 * Resolves the visual interaction state for a specific data point.
 */
function getPointInteractionState<T>(
  data: T,
  hover: HoverInteraction<T> | null,
  cx: number,
  cy: number,
) {
  const isHovered =
    hover?.target?.data === data ||
    (hover?.target?.coordinate &&
      Math.abs(hover.target.coordinate.x - cx) < 0.1 &&
      Math.abs(hover.target.coordinate.y - cy) < 0.1);

  const isDimmed = !!hover?.target && !isHovered;

  return { isHovered, isDimmed };
}

export function ScatterSeries<T>({
  data: localData,
  x: localX,
  y: localY,
  size: localSize,
  color,
  label,
  hideCursor,
}: ScatterSeriesProps<T>) {
  const {
    data: contextData,
    width,
    height,
    config,
    x: contextX,
    y: contextY,
  } = useChartContext<T>();

  const hover = useInteraction<HoverInteraction<T>>(InteractionType.HOVER);

  const data = localData || contextData;
  const xAccessor =
    (localX ? resolveAccessor(localX) : undefined) ||
    (contextX ? resolveAccessor(contextX) : undefined);
  const yAccessor =
    (localY ? resolveAccessor(localY) : undefined) ||
    (contextY ? resolveAccessor(contextY) : undefined);
  const sizeAccessor = localSize ? resolveAccessor(localSize) : undefined;

  const { margin } = config;

  const scaleCtx = useMemo(() => {
    if (!xAccessor || !yAccessor || !data.length || width <= 0 || height <= 0) {
      return null;
    }
    const scales = createScales(
      data,
      width,
      height,
      margin,
      xAccessor,
      yAccessor,
      "scatter",
    );

    let rScale: any = null;
    if (sizeAccessor) {
      const maxVal = Math.max(...data.map((d) => sizeAccessor(d) || 0));
      // Use sqrt scale for circular area sizing (area ~ value)
      rScale = (val: number) => {
        const normalized = Math.sqrt(val) / Math.sqrt(maxVal);
        return 4 + normalized * 16;
      };
    }

    return { ...scales, rScale };
  }, [data, width, height, margin, xAccessor, yAccessor, sizeAccessor]);

  useSeriesRegistration({
    label: label || "Scatter Series",
    color: color,
    y: localY || contextY,
    hideCursor: hideCursor,
    interactionMode: "xy",
  });

  if (!scaleCtx || !xAccessor || !yAccessor) {
    return null;
  }
  const { xScale, yScale, rScale } = scaleCtx;
  const strokeColor = color || "var(--primary)";

  return (
    <g className="chart-scatter-series">
      {(() => {
        const regularPoints: React.JSX.Element[] = [];
        const activePoints: React.JSX.Element[] = [];

        data.forEach((d, i) => {
          const cx = (xScale as any)(xAccessor(d));
          const cy = yScale(yAccessor(d));

          const { isHovered, isDimmed } = getPointInteractionState(
            d,
            hover,
            cx,
            cy,
          );

          let radius = 6;
          if (rScale && sizeAccessor) {
            radius = rScale(sizeAccessor(d));
          }

          const point = (
            <SeriesPoint
              key={i}
              color={strokeColor}
              data-index={i}
              hoverRadius={radius + 4}
              isDimmed={isDimmed}
              isHovered={isHovered}
              radius={radius}
              x={cx}
              y={cy}
            />
          );

          if (isHovered) {
            activePoints.push(point);
          } else {
            regularPoints.push(point);
          }
        });

        return [...regularPoints, ...activePoints];
      })()}
    </g>
  );
}

export function ScatterSeriesWrapper(props: ScatterSeriesProps<any>) {
  const { config } = useChartContext();
  return (
    <g transform={`translate(${config.margin.left}, ${config.margin.top})`}>
      <ScatterSeries {...props} />
    </g>
  );
}
