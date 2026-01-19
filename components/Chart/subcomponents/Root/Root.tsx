"use client";

import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Card } from "../../../Card/Card";
import { Text } from "../../../Text/Text";
import { ChartContext, ChartContextValue } from "../../context";
import {
  ChartConfig,
  ChartProps,
  HoverState,
  LegendItem,
  resolveAccessor,
} from "../../types";
import { calculateTooltipTransform } from "../../utils/tooltip";
import { Header } from "../Header/Header";
import { Legend } from "../Legend/Legend";
import { Series } from "../Series/Series";
import styles from "./Root.module.scss";

const EMPTY_STYLES = {};

// Theme-compatible color palette for auto-assigned legend colors
const LEGEND_PALETTE = [
  "var(--primary)",
  "var(--secondary)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--error)",
];

export type RootProps<T> = Pick<
  ChartProps<T>,
  | "data"
  | "d3Config"
  | "className"
  | "style"
  | "onValueChange"
  | "variant"
  | "flat"
  | "withFrame"
  | "type"
  | "render"
  | "x"
  | "y"
  | "title"
  | "subtitle"
  | "withLegend"
  | "renderTooltip"
> & {
  children?: React.ReactNode;
};

export function Root<T>({
  data,
  d3Config,
  className,
  style,
  onValueChange,
  variant = "default",
  flat,
  withFrame = true,
  children,
  type,
  render,
  x,
  y,
  title,
  subtitle,
  withLegend,
  renderTooltip,
}: RootProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [activeData, setActiveData] = useState<T | null>(null);
  const [hoverState, setHoverState] = useState<HoverState<T> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // const [registeredSeries, setRegisteredSeries] = useState<LegendItem[]>([]); // Removed unused state

  const [margin, setMargin] = useState({
    top: d3Config?.margin?.top ?? 40, // Increased to provide space for Header
    right: d3Config?.margin?.right ?? 20,
    bottom: d3Config?.margin?.bottom ?? 50, // Reduced - X label is closer now
    left: d3Config?.margin?.left ?? 70, // Reduced - Y tick labels are end-anchored
  });

  // Reset margins if config changes
  useEffect(() => {
    setMargin({
      top: d3Config?.margin?.top ?? 40,
      right: d3Config?.margin?.right ?? 20,
      bottom: d3Config?.margin?.bottom ?? 50,
      left: d3Config?.margin?.left ?? 70,
    });
  }, [d3Config]);

  const requestLayoutAdjustment = useCallback(
    (
      suggested: Partial<{
        top: number;
        right: number;
        bottom: number;
        left: number;
      }>,
    ) => {
      // Cap margins at reasonable maximums to prevent runaway growth
      const MAX_MARGIN = 150;

      setMargin((prev) => {
        let changed = false;
        const next = { ...prev };

        if (
          suggested.left &&
          suggested.left > prev.left &&
          suggested.left <= MAX_MARGIN
        ) {
          next.left = Math.min(suggested.left, MAX_MARGIN);
          changed = true;
        }
        if (
          suggested.bottom &&
          suggested.bottom > prev.bottom &&
          suggested.bottom <= MAX_MARGIN
        ) {
          next.bottom = Math.min(suggested.bottom, MAX_MARGIN);
          changed = true;
        }
        if (
          suggested.right &&
          suggested.right > prev.right &&
          suggested.right <= MAX_MARGIN
        ) {
          next.right = Math.min(suggested.right, MAX_MARGIN);
          changed = true;
        }
        if (
          suggested.top &&
          suggested.top > prev.top &&
          suggested.top <= MAX_MARGIN
        ) {
          next.top = Math.min(suggested.top, MAX_MARGIN);
          changed = true;
        }

        return changed ? next : prev;
      });
    },
    [],
  );

  const config = useMemo(() => {
    return {
      showAxes: true,
      ...d3Config,
      type, // Add chart type to config
      margin, // Use state-managed margin
    } as ChartConfig & {
      margin: { top: number; right: number; bottom: number; left: number };
      type?: string;
    };
  }, [d3Config, margin, type]);

  const tooltipRef = useRef<HTMLDivElement>(null);

  // Update tooltip position when hover state changes
  useEffect(() => {
    if (activeData && tooltipRef.current && wrapperRef.current && hoverState) {
      const { tooltipX, tooltipY, isTouch } = hoverState;
      const rect = wrapperRef.current.getBoundingClientRect();
      const tooltipWidth = tooltipRef.current.offsetWidth;

      const transform = calculateTooltipTransform(
        { cursorX: tooltipX, cursorY: tooltipY, isTouch },
        { tooltipWidth, wrapperLeft: rect.left },
      );

      tooltipRef.current.style.transform = transform;
    }
  }, [activeData, hoverState]);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          setWidth(entry.contentBoxSize[0].inlineSize);
          setHeight(entry.contentBoxSize[0].blockSize);
        } else {
          setWidth(entry.contentRect.width);
          setHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(wrapperRef.current);

    // Mobile check
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 600px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const seriesMapRef = useRef<Map<string, LegendItem[]>>(new Map());
  const [, forceUpdate] = useState({});

  const registerSeries = useCallback((id: string, items: LegendItem[]) => {
    seriesMapRef.current.set(id, items);
    forceUpdate({});
    return Array.from(seriesMapRef.current.keys()).indexOf(id);
  }, []);

  const unregisterSeries = useCallback((id: string) => {
    if (seriesMapRef.current.has(id)) {
      seriesMapRef.current.delete(id);
      forceUpdate({});
    }
  }, []);

  // Sync ref map to state for Legend consumption
  // Actually, we can just derive legendItems from the ref on every render!
  const legendItems = useMemo(() => {
    const items: LegendItem[] = [];
    seriesMapRef.current.forEach((val) => items.push(...val));

    if (items.length > 0) {
      return items.map((item, index) => ({
        ...item,
        color: item.color || LEGEND_PALETTE[index % LEGEND_PALETTE.length],
      }));
    }

    if (d3Config?.yAxisLabel) {
      return [
        {
          label: d3Config.yAxisLabel,
          color: LEGEND_PALETTE[0],
          // Fallback item implies no series are registered (e.g. custom render).
          // We shouldn't assume a cursor line is desired for custom visualizations.
          hideCursor: true,
        },
      ];
    }

    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesMapRef.current.size, d3Config?.yAxisLabel]);

  // Stable reference to activeData for use in callbacks without triggering re-creation
  const activeDataRef = useRef(activeData);
  useEffect(() => {
    activeDataRef.current = activeData;
  }, [activeData]);

  const setActiveDataCallback = useCallback(
    (d: T | null) => {
      setActiveData(d);
      onValueChange?.(d);
    },
    [onValueChange],
  );

  const setHoverStateCallback = useCallback(
    (state: HoverState<T> | null) => {
      setHoverState(state);
      // Use ref to check current activeData without depending on it
      if (state?.data !== activeDataRef.current) {
        setActiveData(state?.data || null);
        onValueChange?.(state?.data || null);
      }
    },
    [onValueChange],
  );

  const showTooltip = useCallback(
    (event: React.MouseEvent | React.TouchEvent, d: T) => {
      if (!wrapperRef.current) {
        return;
      }
      const rect = wrapperRef.current.getBoundingClientRect();

      let clientX, clientY;
      if ("touches" in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (
        "changedTouches" in event &&
        (event as React.TouchEvent).changedTouches.length > 0
      ) {
        clientX = (event as React.TouchEvent).changedTouches[0].clientX;
        clientY = (event as React.TouchEvent).changedTouches[0].clientY;
      } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setHoverStateCallback({
        tooltipX: x,
        tooltipY: y,
        cursorLineX: x, // Fallback without snapping
        cursorLineY: y,
        data: d,
        isTouch: event.type.startsWith("touch"),
      });
    },
    [],
  );

  const hideTooltip = useCallback(() => {
    setHoverState(null);
  }, []);

  const resolveInteraction = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      let clientX, clientY;
      if ("touches" in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (
        "changedTouches" in event &&
        (event as React.TouchEvent).changedTouches.length > 0
      ) {
        clientX = (event as React.TouchEvent).changedTouches[0].clientX;
        clientY = (event as React.TouchEvent).changedTouches[0].clientY;
      } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
      }

      const element = document.elementFromPoint(clientX, clientY);
      if (!element) {
        return null;
      }

      const data = (element as any).__data__;
      if (data) {
        return { element, data: data as T };
      }
      return null;
    },
    [],
  );

  const value: ChartContextValue<T> = useMemo(
    () => ({
      data,
      config,
      width,
      height,
      activeData,
      setActiveData: setActiveDataCallback,
      styles: EMPTY_STYLES, // Subcomponents manage styles (stable ref)
      hoverState,
      setHoverState: setHoverStateCallback,
      showTooltip,
      hideTooltip,
      resolveInteraction,
      isMobile,
      registerSeries,
      unregisterSeries,
      requestLayoutAdjustment,
      colorPalette: LEGEND_PALETTE,
      legendItems,
      x: x ? (x as any) : undefined,
      y: y ? (y as any) : undefined,
    }),
    [
      data,
      config,
      width,
      height,
      activeData,
      setActiveDataCallback,
      hoverState,
      setHoverStateCallback,
      showTooltip,
      hideTooltip,
      resolveInteraction,
      isMobile,
      legendItems,
      registerSeries,
      unregisterSeries,
      requestLayoutAdjustment,
      x,
      y,
    ],
  );

  const hasContent = React.Children.count(children) > 0;
  // If no children provided, we render the shorthand components
  const showShorthand = !hasContent && (type || render || x || y);

  return (
    <ChartContext.Provider value={value as any}>
      <div
        className={clsx(
          styles.chartContainer,
          variant === "solid" && styles.solid,
          flat && styles.flat,
          isMobile && styles.mobile,
          !withFrame && styles.frameless,
          className,
        )}
        style={style}
      >
        {(title || subtitle) && <Header subtitle={subtitle} title={title} />}

        <div
          ref={wrapperRef}
          className={styles.responsiveWrapper}
          style={{ flex: 1, position: "relative" }}
        >
          {width > 0 && height > 0 && (
            <svg
              className="chart-plot"
              height={height}
              style={{ overflow: "visible" }}
              width={width}
            >
              {children}
              {showShorthand && (
                <Series
                  render={render}
                  renderTooltip={renderTooltip}
                  type={type}
                  x={x}
                  y={y}
                />
              )}
            </svg>
          )}
        </div>

        {withLegend && <Legend />}

        {activeData && hoverState && (
          <div
            ref={tooltipRef}
            className={styles.tooltipWrapper}
            style={{
              pointerEvents: "none",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {renderTooltip ? (
              renderTooltip(activeData)
            ) : (
              <Card className={styles.tooltipCard}>
                {/* Header: X Value (Unified) */}
                <Text className={styles.tooltipLabel} variant="h6">
                  {x ? String((x as any)(activeData)) : "Value"}
                </Text>

                {/* Body: List of Series Values */}
                {legendItems.length > 0 ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {legendItems.map((item, i) => {
                      const accessor = item.yAccessor
                        ? resolveAccessor(item.yAccessor)
                        : null;
                      const val = accessor
                        ? accessor(activeData)
                        : y
                          ? resolveAccessor(y as any)(activeData)
                          : null;
                      if (val === null || val === undefined) {
                        return null;
                      }
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: item.color,
                            }}
                          />
                          <Text
                            style={{ color: "var(--text-secondary)" }}
                            variant="body"
                          >
                            {item.label}:
                          </Text>
                          <Text variant="h6">
                            {d3Config?.yAxisLabel?.includes("$") ||
                            (typeof val === "number" && val > 1000)
                              ? `$${val.toLocaleString()}`
                              : String(val)}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Text variant="h4">
                    {y ? String((y as any)(activeData)) : ""}
                  </Text>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </ChartContext.Provider>
  );
}
