"use client";

import clsx from "clsx";
import { pointer, select } from "d3-selection";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  withFrame = true,
  onValueChange,
}: ChartProps<T>) {
  const TOOLTIP_OFFSET = 20;

  const HIDE_DELAY_MS = 16;
  const MOBILE_BREAKPOINT = 480;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipPosRef = useRef({ x: 0, y: 0, isTouch: false });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gradientId = React.useId().replace(/:/g, "");

  const [activeData, setActiveData] = useState<T | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const isMobile = dimensions.width > 0 && dimensions.width < MOBILE_BREAKPOINT;

  useEffect(() => {
    onValueChange?.(activeData ?? null);
  }, [activeData, onValueChange]);

  const config = useMemo(
    () => ({
      margin: {
        top: 20,
        right: 20,
        bottom: d3Config?.xAxisLabel ? 60 : 50,
        left: d3Config?.yAxisLabel ? 85 : 55,
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

  const calculateTooltipTransform = (
    tx: number,
    ty: number,
    isTouch: boolean = false,
  ) => {
    if (!tooltipRef.current || !wrapperRef.current) {
      return "";
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const absX = rect.left + tx;

    let xOffset = TOOLTIP_OFFSET;

    // Check right edge
    if (absX + tooltipWidth + TOOLTIP_OFFSET > window.innerWidth - 10) {
      xOffset = -TOOLTIP_OFFSET - tooltipWidth;
    }

    // Check left edge (after potential flip)
    if (rect.left + tx + xOffset < 10) {
      xOffset = 10 - (rect.left + tx);
    }

    // Apply Y offset for touch to avoid finger occlusion
    // Shift tooltip 50px above touch point to clear the finger
    const effectiveY = isTouch ? ty - 50 : ty;

    return `translate3d(${tx + xOffset}px, calc(${effectiveY}px - 50%), 0)`;
  };

  useLayoutEffect(() => {
    if (activeData && tooltipRef.current && wrapperRef.current) {
      const { x, y, isTouch } = tooltipPosRef.current;
      const transform = calculateTooltipTransform(x, y, !!isTouch);
      if (transform) {
        tooltipRef.current.style.transform = transform;
      }
    }
  }, [activeData]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

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

    const margin = {
      ...config.margin,
      right: isMobile ? 10 : config.margin.right,
      bottom: isMobile
        ? d3Config?.xAxisLabel
          ? 50
          : 30
        : config.margin.bottom,
      left: isMobile ? (d3Config?.yAxisLabel ? 65 : 30) : config.margin.left,
    };

    if (width <= 0 || height <= 0) {
      return;
    }

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

    if (innerWidth <= 0 || innerHeight <= 0) {
      return;
    }

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
        isMobile,
      );
    }

    const updateTooltip = (
      tx: number,
      ty: number,
      data: T,
      isTouch: boolean = false,
    ) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      tooltipPosRef.current = { x: tx, y: ty, isTouch };

      if (tooltipRef.current && wrapperRef.current) {
        const transform = calculateTooltipTransform(tx, ty, isTouch);
        if (transform) {
          tooltipRef.current.style.transform = transform;
        }
      }

      setActiveData((prev) => (prev === data ? prev : data));
    };

    const showTooltip = (event: any, data: T) => {
      const [px, py] = select(svgRef.current).select("g").empty()
        ? [0, 0]
        : pointer(event, g.node());

      const tx = px + margin.left;
      const ty = py + margin.top;

      updateTooltip(tx, ty, data);
    };

    const hideTooltip = () => {
      hideTimeoutRef.current = setTimeout(
        () => setActiveData(null),
        HIDE_DELAY_MS,
      );
    };

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
      setHoverState: (
        state: { x: number; y: number; data: T; isTouch?: boolean } | null,
      ) => {
        if (!state) {
          hideTooltip();
        } else {
          updateTooltip(state.x, state.y, state.data, state.isTouch ?? false);
        }
      },
      showTooltip,
      hideTooltip,
      type,
      isMobile,
      resolveInteraction: (event: any) => {
        if (event.cancelable && event.type.startsWith("touch")) {
          event.preventDefault();
        }

        let el: Element | null = null;

        if (event.touches && event.touches.length > 0) {
          const touch = event.touches[0];
          el = document.elementFromPoint(touch.clientX, touch.clientY);
        } else {
          el = event.currentTarget as Element;
        }

        if (!el) {
          return null;
        }

        const data = select(el).datum() as T;

        if (Array.isArray(data)) {
          return null;
        }

        return data ? { element: el, data } : null;
      },
    };

    if (render) {
      render(ctx);
    } else if (type === "bar") {
      drawBars(ctx);
    } else {
      drawLineArea(ctx);
    }
  }, [data, config, type, gradientId, dimensions, render, isMobile, x, y]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        styles.chartContainer,
        variant === "solid" && styles.solid,
        flat && styles.flat,
        isMobile && styles.mobile,
        !withFrame && styles.frameless,
        className,
      )}
      style={{
        height: config.height || 400,
        width: config.width || "100%",
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

          {activeData && (
            <div
              ref={tooltipRef}
              className={styles.tooltipWrapper}
              style={{ pointerEvents: "none" }}
            >
              {renderTooltip ? (
                renderTooltip(activeData)
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
                      {x(activeData)}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ margin: 0 }} variant="h4">
                      {y(activeData)}
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
