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
import { createSeriesStore } from "../../state/store/stores/series/series.store";
import { ChartConfig, ChartProps, HoverState } from "../../types";
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

  const activeDataRef = useRef(activeData);
  useEffect(() => {
    activeDataRef.current = activeData;
  }, [activeData]);

  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
    isTouch: boolean;
  } | null>(null);

  const [stableHoverState, setStableHoverState] =
    useState<HoverState<T> | null>(null);

  const setHoverStateCallback = useCallback(
    (state: HoverState<T> | null) => {
      if (state) {
        setTooltipPosition({
          x: state.tooltipX,
          y: state.tooltipY,
          isTouch: state.isTouch,
        });
      } else {
        setTooltipPosition(null);
      }

      const nextData = state?.data || null;

      if (nextData !== activeDataRef.current) {
        activeDataRef.current = nextData;
        setActiveData(nextData);
        onValueChange?.(nextData);
        setStableHoverState(state);
      } else if (state === null && activeDataRef.current !== null) {
        activeDataRef.current = null;
        setActiveData(null);
        onValueChange?.(null);
        setStableHoverState(null);
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
    top: d3Config?.margin?.top ?? 40,
    right: d3Config?.margin?.right ?? 20,
    bottom: d3Config?.margin?.bottom ?? 50,
    left: d3Config?.margin?.left ?? 70,
  });

  const lastUserMarginRef = useRef(d3Config?.margin);
  useEffect(() => {
    if (
      d3Config?.margin?.top !== lastUserMarginRef.current?.top ||
      d3Config?.margin?.left !== lastUserMarginRef.current?.left ||
      d3Config?.margin?.bottom !== lastUserMarginRef.current?.bottom ||
      d3Config?.margin?.right !== lastUserMarginRef.current?.right
    ) {
      lastUserMarginRef.current = d3Config?.margin;
      setMargin({
        top: d3Config?.margin?.top ?? 40,
        right: d3Config?.margin?.right ?? 20,
        bottom: d3Config?.margin?.bottom ?? 50,
        left: d3Config?.margin?.left ?? 70,
      });
    }
  }, [d3Config?.margin]);

  const requestLayoutAdjustment = useCallback(
    (
      suggested: Partial<{
        top: number;
        right: number;
        bottom: number;
        left: number;
      }>,
    ) => {
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
      type,
      margin,
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

  // Create a new store instance for this chart
  const seriesStoreInstance = useMemo(() => createSeriesStore(), []);

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
    }, [behaviors, on, off, eventsContext]);

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

      const elements = document.elementsFromPoint(clientX, clientY);

      for (const element of elements) {
        const data = (element as any).__data__;
        if (data && !Array.isArray(data)) {
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

      styles: EMPTY_STYLES,
      hoverState: stableHoverState,
      setHoverState: setHoverStateCallback,
      resolveInteraction,
      isMobile,
      requestLayoutAdjustment,
      colorPalette: LEGEND_PALETTE,
      seriesStore: seriesStoreInstance,
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
      stableHoverState,
      setHoverStateCallback,
      resolveInteraction,
      isMobile,
      requestLayoutAdjustment,
      seriesStoreInstance,
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
                  <g
                    data-chart-inner-plot
                    transform={`translate(${config.margin.left}, ${config.margin.top})`}
                  >
                    <rect
                      fill="transparent"
                      height={height - config.margin.top - config.margin.bottom}
                      width={width - config.margin.left - config.margin.right}
                    />
                  </g>

                  {hasContent && !hasGrid && config.grid !== false && <Grid />}

                  {hasContent && !hasCursor && !render && (
                    <CursorWrapper mode="line" />
                  )}

                  {children}

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
