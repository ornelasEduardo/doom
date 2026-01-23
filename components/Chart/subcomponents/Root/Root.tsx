"use client";

import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CartesianHover } from "../../behaviors";
import { ChartContext, ChartContextValue } from "../../context";
import { EventsProvider, useEventContext } from "../../state/EventContext";
import { ChartConfig, ChartProps, HoverState, LegendItem } from "../../types";
import { ChartBehavior } from "../../types/events";
import { hasChildOfTypeDeep } from "../../utils/componentDetection";
import { Axis } from "../Axis/Axis";
import { CursorWrapper } from "../Cursor/Cursor";
import { Grid } from "../Grid/Grid";
import { Header } from "../Header/Header";
import { InputSensor } from "../InputLayer/InputSensor";
import { Legend } from "../Legend/Legend";
import { Plot } from "../Plot/Plot";
import { Series } from "../Series/Series";
import { Tooltip } from "../Tooltip/Tooltip";
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
  behaviors?: ChartBehavior[];
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
  behaviors,
}: RootProps<T>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [activeData, setActiveData] = useState<T | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Stable reference to activeData for use in callbacks without triggering re-creation
  const activeDataRef = useRef(activeData);
  useEffect(() => {
    activeDataRef.current = activeData;
  }, [activeData]);

  // Volatile state for 60fps tooltip positioning (DOES NOT TRIGGER CONTEXT UPDATES)
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
    isTouch: boolean;
  } | null>(null);

  // Stable state for Context consumption (Series highlighting, Cursor snapping)
  // Only updates when the DATA point changes or snap position changes.
  const [stableHoverState, setStableHoverState] =
    useState<HoverState<T> | null>(null);

  const setHoverStateCallback = useCallback(
    (state: HoverState<T> | null) => {
      // Always update volatile tooltip position
      if (state) {
        setTooltipPosition({
          x: state.tooltipX,
          y: state.tooltipY,
          isTouch: state.isTouch,
        });
      } else {
        setTooltipPosition(null);
      }

      // Only update stable state if data reference changes (optimization)
      // or if we have no state (reset)
      const nextData = state?.data || null;

      if (nextData !== activeDataRef.current) {
        activeDataRef.current = nextData;
        setActiveData(nextData);
        onValueChange?.(nextData);
        // Only trigger context update when data actually changes
        setStableHoverState(state);
      } else if (state === null && activeDataRef.current !== null) {
        // Handle clearing state
        activeDataRef.current = null;
        setActiveData(null);
        onValueChange?.(null);
        setStableHoverState(null);
      } else if (state && activeDataRef.current === nextData) {
        // Data is same, but we might want to update cursorLine if it's different?
        // For "nearest-x", cursorLineX is usually the same for same data.
        // If we don't update this, Cursor might look laggy if it's supposed to follow mouse?
        // If cursor follows mouse, it should subscribe to volatile state...
        // But Cursor component currently reads from Context.
        // Let's assume Cursor snaps to data (stable).
        // So we DON'T update stableHoverState here to save re-renders.
      }
    },
    [onValueChange],
  );

  const setActiveDataCallback = useCallback(
    (d: T | null) => {
      setActiveData(d);
      onValueChange?.(d);
    },
    [onValueChange],
  );

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
  const legendItems = useMemo<LegendItem[]>(() => {
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

  // Sync internal refs with state refs for legacy support if needed
  // (We use state for context propagation, but refs for immediate callback access if needed)

  // Internal component to consume contexts and run effects
  const BehaviorRunner = () => {
    const eventsContext = useEventContext();
    const chartContext = value;

    const chartContextRef = useRef(chartContext);
    chartContextRef.current = chartContext;

    const { on, off } = eventsContext;

    useEffect(() => {
      const activeBehaviors = behaviors || [CartesianHover()];

      const cleanups = activeBehaviors.map((behavior) => {
        return behavior({
          ...eventsContext,
          getChartContext: () => chartContextRef.current,
        });
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    }, [behaviors, on, off]);

    return null;
  };

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

      // Use elementsFromPoint to pierce through the InputSensor layer
      const elements = document.elementsFromPoint(clientX, clientY);

      for (const element of elements) {
        // Skip the InputSensor itself (or any other non-data element if needed)
        // We look for D3's __data__ property
        const data = (element as any).__data__;
        if (data) {
          return { element: element as Element, data: data as T };
        }
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
      styles: EMPTY_STYLES,
      hoverState: stableHoverState,
      setHoverState: setHoverStateCallback,
      resolveInteraction,
      isMobile,
      registerSeries,
      unregisterSeries,
      requestLayoutAdjustment,
      colorPalette: LEGEND_PALETTE,
      legendItems,
      x: x ? (x as any) : undefined,
      y: y ? (y as any) : undefined,
      setWidth,
      setHeight,
      variant,
    }),
    [
      data,
      config,
      width,
      height,
      activeData,
      setActiveDataCallback,
      stableHoverState,
      setHoverStateCallback,
      resolveInteraction,
      isMobile,
      legendItems,
      registerSeries,
      unregisterSeries,
      requestLayoutAdjustment,
      x,
      y,
      variant,
    ],
  );

  const hasContent = React.Children.count(children) > 0;
  const showShorthand = !hasContent && (type || render || x || y);

  const hasPlot = hasContent && hasChildOfTypeDeep(children, Plot);

  const isAutoLayout = !hasPlot;

  const hasGrid = hasContent && hasChildOfTypeDeep(children, Grid);
  const hasAxis = hasContent && hasChildOfTypeDeep(children, Axis);
  const hasCursor = hasContent && hasChildOfTypeDeep(children, CursorWrapper);

  // Determine active behaviors
  const effectiveBehaviors =
    behaviors === undefined ? [CartesianHover()] : behaviors;
  const hasInteractions = effectiveBehaviors.length > 0;

  return (
    <ChartContext.Provider
      value={value as unknown as ChartContextValue<unknown>}
    >
      <EventsProvider>
        <BehaviorRunner />
        <div
          data-chart-container
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
          {hasInteractions && <InputSensor />}
          {isAutoLayout && (title || subtitle) && (
            <Header subtitle={subtitle} title={title} />
          )}

          {isAutoLayout ? (
            <div
              ref={wrapperRef}
              className={styles.responsiveWrapper}
              style={{ flex: 1, position: "relative" }}
            >
              {width > 0 && height > 0 && (
                <svg
                  data-chart-plot
                  className="chart-plot"
                  height={height}
                  style={{ overflow: "visible" }}
                  width={width}
                >
                  {/* Inner plot wrapper for InputSensor coordinate detection */}
                  <g
                    data-chart-inner-plot
                    transform={`translate(${config.margin.left}, ${config.margin.top})`}
                  >
                    {/* Transparent rect covering the inner plot area for bounding calculations */}
                    <rect
                      fill="transparent"
                      height={height - config.margin.top - config.margin.bottom}
                      width={width - config.margin.left - config.margin.right}
                    />
                  </g>

                  {/* Auto-inject Grid if using composition and not explicitly provided */}
                  {hasContent && !hasGrid && config.grid !== false && <Grid />}

                  {/* Auto-inject CursorLine BEFORE children so it renders behind series */}
                  {hasContent && !hasCursor && !render && (
                    <CursorWrapper mode="line" />
                  )}

                  {children}

                  {/* Auto-inject Axis if using composition and not explicitly provided */}
                  {hasContent && !hasAxis && config.showAxes !== false && (
                    <Axis />
                  )}

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
          ) : (
            // Custom layout: Render children directly. Children must include <Plot> (or similar) to render chart.
            children
          )}

          {isAutoLayout && withLegend && <Legend />}

          {activeData && tooltipPosition && (
            <Tooltip
              activeData={activeData}
              containerRef={wrapperRef}
              position={tooltipPosition}
              renderTooltip={renderTooltip}
            />
          )}
        </div>
      </EventsProvider>
    </ChartContext.Provider>
  );
}
