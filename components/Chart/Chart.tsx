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
import { Flex, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import styles from "./Chart.module.scss";
import { LegendPosition } from "./types";

// Theme-compatible color palette for auto-assigned legend colors
const LEGEND_PALETTE = [
  "var(--primary)",
  "var(--secondary)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--error)",
];
import {
  createScales,
  drawAxes,
  drawBars,
  drawGrid,
  drawLineArea,
  setupGradient,
} from "./renderers";
import { ChartProps } from "./types";

export type {
  ChartConfig,
  ChartProps,
  DrawContext,
  LegendConfig,
  LegendItem,
  LegendPosition,
} from "./types";

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
  subtitle,
  legend,
  render,
  withFrame = true,
  onValueChange,
}: ChartProps<T>) {
  // Constants
  const MOBILE_ASPECT_RATIO = 0.75; // 4:3 aspect ratio for mobile
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
  const [containerWidth, setContainerWidth] = useState(0);

  const isMobile = containerWidth > 0 && containerWidth < MOBILE_BREAKPOINT;

  // Determine legend position based on device
  const legendPosition: LegendPosition = isMobile
    ? (legend?.position?.mobile ?? "bottom")
    : (legend?.position?.default ?? "top");

  // Calculate auto height for mobile if not explicitly set
  const autoHeight = useMemo(() => {
    if (d3Config?.height) {
      return d3Config.height;
    }

    // On mobile, use aspect ratio for balanced proportions
    if (isMobile && containerWidth > 0) {
      return Math.round(containerWidth * MOBILE_ASPECT_RATIO);
    }

    return 400; // Default height
  }, [d3Config?.height, isMobile, containerWidth]);

  useEffect(() => {
    onValueChange?.(activeData ?? null);
  }, [activeData, onValueChange]);

  // Effective y-axis label (hidden on mobile for space)
  const effectiveYAxisLabel = isMobile ? undefined : d3Config?.yAxisLabel;

  const config = useMemo(
    () => ({
      margin: {
        top: isMobile ? 10 : 20,
        right: isMobile ? 10 : 20,
        bottom: isMobile ? 40 : d3Config?.xAxisLabel ? 60 : 30,
        // On mobile, use minimal left margin since y-axis label is hidden
        left: isMobile ? 35 : d3Config?.yAxisLabel ? 90 : 60,
      },
      curve: undefined,
      showAxes: true,
      grid: false,
      withGradient: type === "area",
      showDots: false,
      ...d3Config,
      // Override yAxisLabel for mobile
      yAxisLabel: effectiveYAxisLabel,
    }),
    [d3Config, type, isMobile, effectiveYAxisLabel],
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

  // Track container width for auto aspect ratio
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const containerObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    containerObserver.observe(containerRef.current);

    return () => containerObserver.disconnect();
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

    const margin = config.margin;

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
      drawGrid(g, yScale, innerWidth, styles.grid, isMobile);
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

  // Render legend items
  // Render legend items
  const renderLegend = (
    isBottom: boolean = false,
    isMobile: boolean = false,
    layout: "horizontal" | "vertical" = "horizontal",
  ) => {
    const paddingRight = isMobile ? 28 : 30;

    if (!legend?.data?.length) {
      return null;
    }

    // Standard chart (no custom render) supports only 1 series,
    // so we limit the legend to 1 item to match the single curve/bar series.
    // If a custom render function is provided, we respect all legend items.
    const activeData =
      !render && legend.data.length > 1 ? legend.data.slice(0, 1) : legend.data;

    const isVertical = layout === "vertical";

    return (
      <Flex
        className={clsx(styles.legend, isBottom && styles.legendBottom)}
        gap={isVertical ? 2 : 4}
        style={{
          flexWrap: "wrap",
          flexDirection: isVertical ? "column" : "row",
          alignItems: isVertical ? "flex-start" : "center",
          ...(!isBottom &&
            !isVertical && {
              paddingRight: config.margin.left - paddingRight,
            }),
          ...(isBottom && !isMobile && { marginLeft: config.margin.left }),
        }}
      >
        {activeData.map((item, index) => (
          <Flex
            key={item.label}
            align="center"
            className={styles.legendItem}
            gap={1}
          >
            <span
              className={styles.legendDot}
              style={{
                backgroundColor:
                  item.color || LEGEND_PALETTE[index % LEGEND_PALETTE.length],
              }}
            />
            <Text className={styles.legendLabel} variant="small">
              {item.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    );
  };

  // Header with title/subtitle on left, legend on right (when position is top)
  const renderHeader = (isMobile: boolean, legendPosition?: LegendPosition) => {
    const hasTitle = title || subtitle;
    const hasLegendTop = legendPosition === "top" && legend?.data?.length;
    let marginLeft = isMobile ? 28 : 30;

    if (legendPosition && legendPosition === "left") {
      marginLeft = config.margin.left;
    }

    if (!hasTitle && !hasLegendTop) {
      return null;
    }

    return (
      <Flex
        align="center"
        className={styles.chartHeader}
        justify="space-between"
        style={{
          marginLeft: config.margin.left - marginLeft,
          flex: 1, // Allow header to fill available space or share it
        }}
      >
        {hasTitle ? (
          <Stack gap={2}>
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
            {subtitle && (
              <Text className={styles.subtitle} variant="small">
                {subtitle}
              </Text>
            )}
          </Stack>
        ) : (
          <div />
        )}
        {hasLegendTop && renderLegend(false, isMobile)}
      </Flex>
    );
  };

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
        height: autoHeight,
        width: config.width || "100%",
        ...style,
      }}
    >
      <Stack gap={isMobile ? 2 : 4} style={{ flex: 1, minHeight: 0 }}>
        <Flex justify="space-between" style={{ width: "100%" }}>
          {renderHeader(isMobile, legendPosition)}
        </Flex>

        <Flex gap={8} style={{ flex: 1, minHeight: 0 }}>
          {legendPosition === "left" && (
            <div className={styles.legendVertical}>
              {renderLegend(false, isMobile, "vertical")}
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
                          color: "var(--muted-foreground)",
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

          {legendPosition === "right" && (
            <div className={styles.legendVertical}>
              {renderLegend(false, isMobile, "vertical")}
            </div>
          )}
        </Flex>

        {legendPosition === "bottom" && renderLegend(true, isMobile)}
      </Stack>
    </div>
  );
}
