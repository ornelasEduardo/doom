"use client";

import clsx from "clsx";
import { pointer, select } from "d3-selection";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Card } from "../Card/Card";
import { Text } from "../Text/Text";
import styles from "./Chart.module.scss";
import { useChartContext } from "./ChartContext";
import {
  createScales,
  drawAxes,
  drawBars,
  drawGrid,
  drawLineArea,
  setupGradient,
} from "./renderers";
import { ChartProps } from "./types";

export interface ChartPlotProps<T> {
  type?: ChartProps<T>["type"];
  render?: ChartProps<T>["render"];
  renderTooltip?: ChartProps<T>["renderTooltip"];
  className?: string;
  style?: React.CSSProperties;
  label?: string; // For legend
  color?: string; // For legend
}

const TOOLTIP_OFFSET = 20;
const HIDE_DELAY_MS = 16;

export function ChartPlot<T>({
  type = "line",
  render,
  renderTooltip,
  className,
  style,
  label,
  color,
}: ChartPlotProps<T>) {
  const {
    data,
    config,
    activeData,
    setActiveData,
    x,
    y,
    dimensions,
    registerSeries,
  } = useChartContext<T>();
  const { isMobile } = dimensions;

  // Register with Context (Composition API) behavior
  useEffect(() => {
    if (!registerSeries) {
      return;
    }

    // Use label prop, or fallback to capitalized type, or generic "Series"
    const seriesLabel =
      label || (type ? type.charAt(0).toUpperCase() + type.slice(1) : "Series");

    return registerSeries({
      label: seriesLabel,
      color,
    });
  }, [registerSeries, label, color, type]);

  // Local state for the plot dimensions
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipPosRef = useRef({ x: 0, y: 0, isTouch: false });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gradientId = React.useId().replace(/:/g, "");

  const [plotDims, setPlotDims] = useState({ width: 0, height: 0 });

  // Measure measuring!
  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setPlotDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  // Tooltip position logic
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

    if (absX + tooltipWidth + TOOLTIP_OFFSET > window.innerWidth - 10) {
      xOffset = -TOOLTIP_OFFSET - tooltipWidth;
    }
    if (rect.left + tx + xOffset < 10) {
      xOffset = 10 - (rect.left + tx);
    }
    const effectiveY = isTouch ? ty - 50 : ty;
    return `translate3d(${tx + xOffset}px, calc(${effectiveY}px - 50%), 0)`;
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (activeData && tooltipRef.current && wrapperRef.current) {
      const { x, y, isTouch } = tooltipPosRef.current;
      const transform = calculateTooltipTransform(x, y, !!isTouch);
      if (transform) {
        tooltipRef.current.style.transform = transform;
      }
    }
  }, [activeData]);

  // D3 Rendering Side Effect
  useEffect(() => {
    if (
      !svgRef.current ||
      !data.length ||
      plotDims.width === 0 ||
      plotDims.height === 0
    ) {
      return;
    }

    const { width, height } = plotDims;
    const { margin } = config;

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
      setupGradient(svg, gradientId, color);
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
      // Use explicit type cast or simpler update to avoid generic T collision
      // T could be a function, so react thinks (prev) => ... is the value
      setActiveData(data);
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
      color,
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
        const d = select(el).datum() as T;
        if (Array.isArray(d)) {
          return null;
        }
        return d ? { element: el, data: d } : null;
      },
    };

    if (render) {
      render(ctx);
    } else if (type === "bar") {
      drawBars(ctx);
    } else {
      drawLineArea(ctx);
    }
  }, [
    data,
    config,
    type,
    gradientId,
    plotDims,
    render,
    isMobile,
    x,
    y,
    setActiveData,
  ]);

  return (
    <div
      ref={wrapperRef}
      className={clsx(styles.responsiveWrapper, className)}
      style={style}
    >
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
              <Text className={styles.tooltipLabel} variant="h6">
                {x(activeData)}
              </Text>
              <Text variant="h4">{y(activeData)}</Text>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
