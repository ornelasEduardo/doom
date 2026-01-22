"use strict";

import { CurveFactory } from "d3-shape";
import { useEffect, useId, useMemo } from "react";

import { useChartContext } from "../../context";
import { Accessor } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";
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
    registerSeries,
    setHoverState,
    resolveInteraction,
    isMobile,
  } = useChartContext<T>();

  // Determine effective data and accessors
  const data = localData || contextData;
  const xAccessor =
    (localX ? resolveAccessor(localX) : undefined) ||
    (contextX ? resolveAccessor(contextX) : undefined);
  const yAccessor =
    (localY ? resolveAccessor(localY) : undefined) ||
    (contextY ? resolveAccessor(contextY) : undefined);

  const { margin } = config;

  // Custom render support
  // const { render } = props as any; // REMOVED
  // const gRef = useId();

  // If render is provided, we need to expose the context and let it run
  // But strictly speaking, custom render usually needs a ref to the G element.
  // The current architecture is declarative.
  // If `render` provided, we return a <g ref={...} /> and runs the effect?

  // Re-create scales locally
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

  // Define variables needed for effects
  const gradientId = useId().replace(/:/g, "");
  const strokeColor = color || "var(--primary)";

  // Register series with Root for Legend and Cursor
  useEffect(() => {
    registerSeries?.(gradientId, [
      {
        label: label || (config.yAxisLabel ?? "Series"),
        color: strokeColor,
        // We pass the resolved accessor function as yAccessor
        yAccessor: yAccessor as any,
        hideCursor: hideCursor,
      },
    ]);
    return () => {
      // unregisterSeries(gradientId);
    };
  }, [
    registerSeries,
    gradientId,
    strokeColor,
    config.yAxisLabel,
    yAccessor,
    label,
    hideCursor,
  ]);
  // ... (rest of component)

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

  // Support for custom render
  if (render && scaleCtx) {
    // We need to pass the context to the render function.
    // But render usually expects to Manipulate DOM.
    // We can use a callback ref.
    return (
      <g
        ref={(node) => {
          if (node) {
            // Create a selection
            const selection = d3.select(node);
            // Create context
            // This is expensive to construct here fully matching types.ts if proper approaches are missing.
            // But let's try our best or relax the type.
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
              setHoverState,
              resolveInteraction,
            } as any);
          }
        }}
      />
    );
  }

  // Render logic

  if (!paths) {
    return null;
  }

  // Only render area IF it is strictly an area chart.
  // We respect `withGradient` only if we are in area mode.
  const isArea = type === "area" || config.type === "area";
  const showGradient = isArea && config.withGradient !== false;

  return (
    <g className="chart-line-series">
      {/* Gradient Defs */}
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}

      {/* Area */}
      {showGradient && (
        <path
          className={styles.area}
          d={paths.area || ""}
          style={{
            fill: `url(#${gradientId})`,
            // Fallback or if gradient fails? No, if showGradient is true we use it.
            // Wait, if !withGradient but is area, maybe solid fill?
            // Legacy usually implied gradient for area.
            // If implicit area, let's assume gradient for now or check specifically.
          }}
        />
      )}
      {/* Line */}
      <path
        className={styles.path}
        d={paths.line || ""}
        style={{ stroke: strokeColor }}
      />
      {/* Static Dots */}
      {(showDots || config.showDots) && scaleCtx && xAccessor && yAccessor && (
        <g className="chart-dots">
          {data.map((d, i) => (
            <circle
              key={i}
              className={styles.dot}
              cx={(scaleCtx.xScale as any)(xAccessor(d))}
              cy={scaleCtx.yScale(yAccessor(d))}
              r={5}
              style={{ fill: strokeColor }}
            />
          ))}
        </g>
      )}
    </g>
  );
}

// Wrapper for margins
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
