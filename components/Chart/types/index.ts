import * as d3Scale from "d3-scale";
import * as d3Selection from "d3-selection";
import * as d3Shape from "d3-shape";

import { ChartBehavior } from "./events";

export type D3Selection = d3Selection.Selection<
  SVGGElement,
  unknown,
  null,
  undefined
>;
export type SVGSelection = d3Selection.Selection<
  SVGSVGElement,
  unknown,
  null,
  undefined
>;

// D3 scale types used in charts
export type ChartXScale =
  | d3Scale.ScaleLinear<number, number>
  | d3Scale.ScalePoint<string>
  | d3Scale.ScaleBand<string>;

export type ChartYScale = d3Scale.ScaleLinear<number, number>;

// Event type for chart interactions
export type ChartEvent = MouseEvent | TouchEvent;

export interface InteractionState {
  chartX: number; // Relative to Plot 0,0
  chartY: number; // Relative to Plot 0,0
  containerX: number; // Relative to Container (for tooltips)
  containerY: number; // Relative to Container (for tooltips)
  isWithinPlot: boolean;
  isTouch: boolean;
}

// =============================================================================
// HOVER STATE - Mouse/touch interaction state for tooltips and cursors
// =============================================================================

/**
 * Represents the current hover state during chart interaction.
 * Contains position data for both the cursor line (snapped to data) and
 * the tooltip (follows mouse).
 */
export interface HoverState<T> {
  /**
   * X position for the cursor line (snapped to nearest data point).
   * Relative to the chart SVG element, includes margin offset.
   */
  cursorLineX: number;

  /**
   * Y position for the cursor line.
   * Relative to the chart SVG element, includes margin offset.
   */
  cursorLineY: number;

  /**
   * Raw pointer X position for tooltip tracking.
   * Follows the actual mouse/touch position, not snapped to data.
   * Relative to the chart wrapper element.
   */
  tooltipX: number;

  /**
   * Raw pointer Y position for tooltip tracking.
   * Follows the actual mouse/touch position.
   * Relative to the chart wrapper element.
   */
  tooltipY: number;

  /** The data point being hovered */
  data: T;

  /** Whether this is a touch interaction (vs mouse) */
  isTouch: boolean;
}

// =============================================================================
// ACCESSOR TYPES - Enables string accessors for great DX
// =============================================================================

/**
 * Accessor can be a string key (for direct property access) or a function.
 * String accessors provide excellent DX: x="month" instead of x={(d) => d.month}
 */
export type Accessor<T, R> = keyof T | ((d: T) => R);

/**
 * Resolves an accessor to a function. If it's a string, returns a property accessor.
 */
export function resolveAccessor<T, R>(accessor: Accessor<T, R>): (d: T) => R {
  if (typeof accessor === "function") {
    return accessor;
  }
  return (d: T) => d[accessor] as R;
}

// =============================================================================
// SERIES CONTEXT - Rich context for custom D3 rendering
// =============================================================================

export interface SeriesContext<T> {
  // D3 essentials
  g: D3Selection;
  data: T[];

  // Dimensions
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  radius: number; // For radial charts: min(width, height) / 2
  margin: { top: number; right: number; bottom: number; left: number };

  // Scales (when using Cartesian accessors)
  xScale?: ChartXScale;
  yScale?: ChartYScale;

  // Resolved accessor functions (when using Cartesian accessors)
  x?: (d: T) => string | number;
  y?: (d: T) => number;

  // Design system integration
  colors: string[];
  color?: string; // Legacy support
  styles: Record<string, string>;
  gradientId: string;

  // Config
  config: ChartConfig;
  type?: SeriesType;
  isMobile: boolean;

  // Interaction (managed by Chart)
  setHoverState: (state: HoverState<T> | null) => void;

  // Interaction helper
  resolveInteraction: (
    event: ChartEvent,
  ) => { element: Element; data: T } | null;
}

// =============================================================================
// SERIES PROPS - Per-series configuration
// =============================================================================

export type SeriesType = "line" | "area" | "bar" | "scatter";

export interface SeriesProps<T> {
  // Chart type (optional when using render)
  type?: SeriesType;

  // Cartesian accessors - string or function
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;

  // Multivariate encoding
  size?: Accessor<T, number>;
  colorEncoding?: Accessor<T, string>; // Data-driven color encoding

  // Per-series data (optional, falls back to Chart data)
  data?: T[];

  // Styling (static colors)
  color?: string; // Single color for entire series
  stroke?: string;
  fill?: string;
  label?: string;

  // Tooltip
  renderTooltip?: (data: T) => React.ReactNode;

  // Full D3 control - overrides type/x/y
  render?: (ctx: SeriesContext<T>) => void;

  // Layout
  className?: string;
  style?: React.CSSProperties;

  // Behavior
  hideCursor?: boolean;
}

// =============================================================================
// CHART CONFIG
// =============================================================================

export interface ChartConfig {
  margin?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
  curve?: d3Shape.CurveFactory;
  showAxes?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  grid?: boolean;
  withGradient?: boolean;
  showDots?: boolean;
  hideYAxisDomain?: boolean;
  animate?: boolean;
  type?: SeriesType;
}

// =============================================================================
// LEGEND TYPES
// =============================================================================

export interface LegendItem {
  label: string;
  color?: string;
  yAccessor?: Accessor<any, number>;
  hideCursor?: boolean;
}

export interface LegendConfig {
  data: LegendItem[];
}

// =============================================================================
// CHART PROPS - Root component props
// =============================================================================

export interface ChartProps<T = unknown> {
  data: T[];
  d3Config?: ChartConfig;
  className?: string;
  style?: React.CSSProperties;
  onValueChange?: (data: T | null) => void;
  variant?: "default" | "solid";
  flat?: boolean;
  withFrame?: boolean;
  title?: string | React.ReactNode;
  subtitle?: string;
  withLegend?: boolean;
  renderTooltip?: (data: T) => React.ReactNode;
  children?: React.ReactNode;

  // For shorthand API - single series defined at root level
  type?: SeriesType;
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
  render?: (context: SeriesContext<T>) => void;
  behaviors?: ChartBehavior[];
}

// Alias for backward compatibility
export type DrawContext<T> = SeriesContext<T>;
