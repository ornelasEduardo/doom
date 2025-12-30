"use client";

import clsx from "clsx";
import { pointer, select } from "d3-selection";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Card } from "../Card/Card";
import { Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import styles from "./Chart.module.scss";
import {
  createScales,
  drawAxes,
  drawBars,
  drawGrid,
  drawLineArea,
  setupGradient,
} from "./renderers";
import { ChartProps } from "./types";

// Re-export types for consumers
export type { ChartConfig, ChartProps, DrawContext } from "./types";

export function Chart<T>({
  data,
  type = "line",
  variant = "default",
  x,
  y,
  d3Config,
  className,
  style,
  renderTooltip,
  flat,
  title,
  render,
}: ChartProps<T>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientId = React.useId().replace(/:/g, "");

  const [hoverState, setHoverState] = useState<{
    x: number;
    y: number;
    data: T;
  } | null>(null);

  const config = useMemo(
    () => ({
      margin: {
        top: 20,
        right: 20,
        bottom: d3Config?.xAxisLabel ? 60 : 50,
        left: d3Config?.yAxisLabel ? 65 : 55,
      },
      curve: undefined,

      showAxes: true,
      grid: false,
      withGradient: type === "area",
      showDots: false,
      ...d3Config,
    }),
    [d3Config, type],
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(wrapperRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (
      !svgRef.current ||
      !data.length ||
      dimensions.width === 0 ||
      dimensions.height === 0
    ) {
      return;
    }

    const { width, height } = dimensions;
    const { margin } = config;

    if (width <= 0 || height <= 0) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (config.withGradient) {
      setupGradient(svg, gradientId);
    }

    const { xScale, yScale, innerWidth, innerHeight } = createScales(
      data,
      width,
      height,
      margin,
      x,
      y,
      type,
    );

    if (innerWidth <= 0 || innerHeight <= 0) return;

    if (config.grid) {
      drawGrid(g, yScale, innerWidth, styles.grid);
    }

    if (config.showAxes) {
      drawAxes(
        g,
        xScale,
        yScale,
        innerWidth,
        innerHeight,
        margin,
        config,
        styles,
      );
    }

    const showTooltip = (event: any, data: T) => {
      // Use pointer relative to the full SVG or the group?
      // If we use d3.pointer(event, g.node()), we get coords relative to g (inside margin).
      // hoverState requires coords relative to the .responsiveWrapper (div).
      // .responsiveWrapper contains SVG.
      // g is translate(margin.left, margin.top).
      // So px + margin.left is correct relative to wrapper.
      // pointer(event, g.node()) returns [x_in_g, y_in_g].
      const [px, py] = select(svgRef.current).select("g").empty()
        ? [0, 0]
        : pointer(event, g.node());

      setHoverState({
        x: px + margin.left + 20,
        y: py + margin.top, // margin.top is added because py is relative to g
        data,
      });
    };

    const hideTooltip = () => setHoverState(null);

    const ctx = {
      g,
      data,
      xScale,
      yScale,
      x,
      y,
      innerWidth,
      innerHeight,
      margin,
      config,
      styles,
      gradientId,
      setHoverState,
      showTooltip,
      hideTooltip,
      type,
    };

    if (render) {
      render(ctx);
    } else if (type === "bar") {
      drawBars(ctx);
    } else {
      drawLineArea(ctx);
    }
  }, [data, config, type, gradientId, dimensions, render]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        styles.chartContainer,
        variant === "solid" && styles.solid,
        flat && styles.flat,
        className,
      )}
      style={{
        minHeight: config.height || 400,
        minWidth: config.width || "100%",
        ...style,
      }}
    >
      <Stack gap={4} style={{ flex: 1, minHeight: 0 }}>
        {title && (
          <div>
            {typeof title === "string" ? (
              <Text style={{ margin: 0 }} variant="h5">
                {title}
              </Text>
            ) : (
              title
            )}
          </div>
        )}

        <div ref={wrapperRef} className={styles.responsiveWrapper}>
          <svg
            ref={svgRef}
            className={styles.chart}
            style={{ display: "block", width: "100%", height: "100%" }}
          />

          {hoverState && (
            <div
              className={styles.tooltipWrapper}
              style={{
                transform: `translate(${hoverState.x}px, ${hoverState.y}px) translateY(-50%)`,
              }}
            >
              {renderTooltip ? (
                renderTooltip(hoverState.data)
              ) : (
                <Card className={styles.tooltipCard}>
                  <div style={{ marginBottom: 4 }}>
                    <Text
                      style={{
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        letterSpacing: "0.5px",
                      }}
                      variant="h6"
                    >
                      {x(hoverState.data as any)}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ margin: 0 }} variant="h4">
                      {y(hoverState.data as any)}
                    </Text>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </Stack>
    </div>
  );
}
