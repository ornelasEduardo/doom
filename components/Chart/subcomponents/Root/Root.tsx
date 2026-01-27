"use client";

import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChartContext } from "../../context";
import { useChartBehaviors } from "../../hooks/useChartBehaviors";
import { SensorManager } from "../../sensors/SensorManager/SensorManager";
import { EventsProvider } from "../../state/EventContext";
import {
  createChartStore,
  Store,
  updateChartDimensions,
  updateChartState,
} from "../../state/store/chart.store";
import {
  Behavior,
  Config,
  ContextValue,
  InteractionChannel,
  Props,
} from "../../types";
import { HoverInteraction } from "../../types/interaction";
import { hasChildOfTypeDeep } from "../../utils/componentDetection";
import { Axis } from "../Axis/Axis";
import { CursorWrapper } from "../Cursor/Cursor";
import { Grid } from "../Grid/Grid";
import { Header } from "../Header/Header";
import { InteractionLayer } from "../InteractionLayer/InteractionLayer";
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
  Props<T>,
  | "data"
  | "d3Config"
  | "className"
  | "style"
  | "onValueChange"
  | "variant"
  | "flat"
  | "withFrame"
  | "title"
  | "subtitle"
  | "withLegend"
  | "children"
  | "type"
  | "x"
  | "y"
  | "render"
  | "behaviors"
  | "sensors"
>;

/**
 * The internal bridge for managing behaviors and sensors.
 */
function BehaviorManager<T>({
  behaviors,
  value,
}: {
  behaviors?: Behavior<T>[];
  value: ContextValue<T>;
}) {
  useChartBehaviors(value, behaviors);
  return null;
}

/**
 * Functional component that provides the plot area container.
 */
function RootPlot({
  children,
  chartStore,
}: {
  children: React.ReactNode;
  chartStore: Store;
}) {
  const plotRef = useRef<SVGGElement>(null);
  const frameRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (plotRef.current && frameRef.current) {
      chartStore.setState((prev: any) => ({
        elements: {
          ...prev.elements,
          plot: plotRef.current,
          frame: frameRef.current,
        },
      }));
    }
  }, [chartStore]);

  const dimensions = chartStore.useStore((s: any) => s.dimensions);

  return (
    <svg
      ref={frameRef}
      className={styles.svg}
      data-chart-plot="true"
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      width={dimensions.width}
    >
      <g
        ref={plotRef}
        className={styles.plot}
        transform={`translate(${dimensions.margin.left}, ${dimensions.margin.top})`}
      >
        {children}
      </g>
    </svg>
  );
}

/**
 * Root component for the Doom Chart system.
 * It initializes the core state (chartStore) and provides the context
 * required by all subcomponents and behaviors.
 */
export function Root<T>({
  data,
  d3Config,
  className,
  style,
  onValueChange,
  variant = "default",
  flat = false,
  withFrame = true,
  title,
  subtitle,
  withLegend = false,
  children,
  type,
  render,
  x,
  y,
  behaviors,
  sensors,
}: RootProps<T>) {
  const [chartStore] = useState(() =>
    createChartStore({ ...d3Config, type }, x, y),
  );
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<any>(null);

  // Sync data to store
  useEffect(() => {
    updateChartState(chartStore, {
      data,
      type,
      dimensions: chartStore.getState().dimensions,
    });
  }, [chartStore, data, type]);

  // Handle onValueChange proxy from Interaction Store
  useEffect(() => {
    return chartStore.subscribe(() => {
      const state = chartStore.getState();
      const hover = state.interactions.get(
        InteractionChannel.PRIMARY_HOVER,
      ) as HoverInteraction<T>;
      const hoverData = hover?.targets[0]?.data ?? null;

      if (hoverData !== lastValueRef.current) {
        lastValueRef.current = hoverData;
        onValueChange?.(hoverData);
      }
    });
  }, [chartStore, onValueChange]);

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
      const state = chartStore.getState();
      const currentMargin = state.dimensions.margin;

      let changed = false;
      const next = { ...currentMargin };

      if (
        suggested.left &&
        suggested.left > currentMargin.left &&
        suggested.left <= MAX_MARGIN
      ) {
        next.left = Math.min(suggested.left, MAX_MARGIN);
        changed = true;
      }
      if (
        suggested.bottom &&
        suggested.bottom > currentMargin.bottom &&
        suggested.bottom <= MAX_MARGIN
      ) {
        next.bottom = Math.min(suggested.bottom, MAX_MARGIN);
        changed = true;
      }
      if (
        suggested.right &&
        suggested.right > currentMargin.right &&
        suggested.right <= MAX_MARGIN
      ) {
        next.right = Math.min(suggested.right, MAX_MARGIN);
        changed = true;
      }
      if (
        suggested.top &&
        suggested.top > currentMargin.top &&
        suggested.top <= MAX_MARGIN
      ) {
        next.top = Math.min(suggested.top, MAX_MARGIN);
        changed = true;
      }

      if (changed) {
        chartStore.setState((prev: any) => ({
          dimensions: {
            ...prev.dimensions,
            margin: next,
          },
        }));
        // Trigger re-calculation
        updateChartDimensions(
          chartStore,
          state.dimensions.width,
          state.dimensions.height,
        );
      }
    },
    [chartStore],
  );

  const config = useMemo(() => {
    return {
      showAxes: true,
      ...d3Config,
      type,
    } as Config & {
      type?: string;
    };
  }, [d3Config, type]);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let w, h;
        if (entry.contentBoxSize) {
          w = entry.contentBoxSize[0].inlineSize;
          h = entry.contentBoxSize[0].blockSize;
        } else {
          w = entry.contentRect.width;
          h = entry.contentRect.height;
        }
        updateChartDimensions(chartStore, w, h);
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
  }, [chartStore]);

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
        const data = (element as unknown as { __data__: unknown }).__data__;
        if (data && !Array.isArray(data)) {
          return { element: element as Element, data: data as T };
        }
      }

      return null;
    },
    [],
  );

  const value: ContextValue<T> = useMemo(
    () => ({
      chartStore,
      data,
      config: config as any,
      width: chartStore.getState().dimensions.width,
      height: chartStore.getState().dimensions.height,

      styles: EMPTY_STYLES,
      resolveInteraction,
      isMobile,
      requestLayoutAdjustment,
      colorPalette: LEGEND_PALETTE,
      // Internal bridges - maintained for system stability during architectural shift
      seriesStore: chartStore as any,
      interactionStore: chartStore as any,
      x: x ? (x as any) : undefined,
      y: y ? (y as any) : undefined,
      variant,
    }),
    [
      chartStore,
      data,
      config,
      resolveInteraction,
      isMobile,
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

  return (
    <ChartContext.Provider value={value as any}>
      <EventsProvider>
        <BehaviorManager behaviors={behaviors as any} value={value as any} />
        <div
          data-chart-container
          aria-describedby={subtitle ? "chart-subtitle" : undefined}
          aria-label={title ? `Chart: ${title}` : "Interactive Chart"}
          className={clsx(
            styles.chartContainer,
            variant === "solid" && styles.solid,
            flat && styles.flat,
            isMobile && styles.mobile,
            !withFrame && styles.frameless,
            className,
          )}
          role="region"
          style={style}
          tabIndex={0}
        >
          <InteractionLayer />
          <SensorManager sensors={sensors as any} />

          {isAutoLayout && (title || subtitle) && (
            <Header subtitle={subtitle} title={title} />
          )}

          {isAutoLayout ? (
            <div
              ref={wrapperRef}
              className={styles.responsiveWrapper}
              style={{ flex: 1, position: "relative" }}
            >
              <RootPlot chartStore={chartStore}>
                {!hasGrid && config.grid !== false && <Grid />}

                {!hasCursor && !render && <CursorWrapper mode="line" />}

                {children}

                {!hasAxis && config.showAxes !== false && <Axis />}

                {showShorthand && (
                  <Series render={render} type={type} x={x} y={y} />
                )}
              </RootPlot>
            </div>
          ) : (
            children
          )}

          {withLegend && <Legend />}

          <Tooltip containerRef={wrapperRef} />
        </div>
      </EventsProvider>
    </ChartContext.Provider>
  );
}
