"use client";

import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";

import styles from "./Chart.module.scss";
import { ChartContext, ChartContextValue } from "./ChartContext";
import { ChartConfig, ChartProps, LegendItem } from "./types";

// Theme-compatible color palette for auto-assigned legend colors
const LEGEND_PALETTE = [
  "var(--primary)",
  "var(--secondary)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--error)",
];

const MOBILE_BREAKPOINT = 480;
const MOBILE_ASPECT_RATIO = 0.75; // 4:3 aspect ratio for mobile

export type ChartRootProps<T> = Pick<
  ChartProps<T>,
  | "data"
  | "d3Config"
  | "className"
  | "style"
  | "onValueChange"
  | "x"
  | "y"
  | "variant"
  | "flat"
  | "withFrame"
  | "type"
  | "render"
> & {
  children?: React.ReactNode;
};

// Helper to calculate margins
function getDefaultChartMargins(
  isMobile: boolean,
  config?: ChartConfig,
): { top: number; right: number; bottom: number; left: number } {
  const showAxes = config?.showAxes !== false; // Default to true if undefined

  if (!showAxes) {
    return {
      top: isMobile ? 10 : 20,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  return {
    top: isMobile ? 10 : 20,
    right: isMobile ? 16 : 20,
    bottom: isMobile ? 40 : config?.xAxisLabel ? 60 : 30,
    left: isMobile ? 30 : config?.yAxisLabel ? 60 : 35,
  };
}

export function ChartRoot<T>({
  data,
  d3Config,
  className,
  style,
  onValueChange,
  x,
  y,

  variant = "default",
  flat,
  withFrame = true,
  children,
  type,
  render,
}: ChartRootProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeData, setActiveData] = useState<T | null>(null);

  const isMobile = containerWidth > 0 && containerWidth < MOBILE_BREAKPOINT;

  // Sync activeData change
  useEffect(() => {
    onValueChange?.(activeData ?? null);
  }, [activeData, onValueChange]);

  // Track container width
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate auto height
  const autoHeight = useMemo(() => {
    if (d3Config?.height) {
      return d3Config.height;
    }
    if (isMobile && containerWidth > 0) {
      return Math.round(containerWidth * MOBILE_ASPECT_RATIO);
    }
    return 400;
  }, [d3Config?.height, isMobile, containerWidth]);

  // Effective y-axis label
  const effectiveYAxisLabel = isMobile ? undefined : d3Config?.yAxisLabel;

  // Merge Config
  const config = useMemo(
    () => ({
      margin: getDefaultChartMargins(isMobile, d3Config),
      curve: undefined,

      showAxes: true,
      grid: false,
      withGradient: false,
      showDots: false,
      ...d3Config,
      yAxisLabel: effectiveYAxisLabel,
    }),
    [d3Config, isMobile, effectiveYAxisLabel],
  ) as ChartConfig & {
    margin: { top: number; right: number; bottom: number; left: number };
  };

  // Registered series from child plots
  const [registeredSeries, setRegisteredSeries] = useState<LegendItem[]>([]);

  const registerSeries = useMemo(
    () => (item: LegendItem) => {
      setRegisteredSeries((prev) => {
        // Avoid duplicates by label
        if (prev.some((i) => i.label === item.label)) {
          return prev;
        }
        return [...prev, item];
      });
      return () => {
        setRegisteredSeries((prev) =>
          prev.filter((i) => i.label !== item.label),
        );
      };
    },
    [],
  );

  // Prepare Legend Items
  // Auto-populate from registered child plots OR default.
  const legendItems = useMemo(() => {
    // 1. Registered series from children (Composition API)
    if (registeredSeries.length > 0) {
      return registeredSeries.map((item, index) => ({
        ...item,
        color: item.color || LEGEND_PALETTE[index % LEGEND_PALETTE.length],
      }));
    }

    // 2. Default fallback (Single Series)
    return [
      {
        label: d3Config?.yAxisLabel || "Series 1",
        color: LEGEND_PALETTE[0],
      },
    ];
  }, [registeredSeries, d3Config?.yAxisLabel]);

  const value = {
    data,
    dimensions: {
      containerWidth,
      isMobile,
    },
    config,
    colorPalette: LEGEND_PALETTE,
    activeData,
    setActiveData,
    x,
    y,
    legendItems,
    type,
    render,
    registerSeries,
  };

  return (
    <ChartContext.Provider value={value as ChartContextValue<unknown>}>
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
        {children}
      </div>
    </ChartContext.Provider>
  );
}
