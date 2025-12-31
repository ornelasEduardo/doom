import * as d3Scale from "d3-scale";
import * as d3Selection from "d3-selection";
import * as d3Shape from "d3-shape";

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

export interface DrawContext<T> {
  g: D3Selection;
  data: T[];
  xScale: ChartXScale;
  yScale: ChartYScale;
  x: (d: T) => string | number;
  y: (d: T) => number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  config: ChartConfig;
  styles: Record<string, string>;
  gradientId: string;
  setHoverState: (
    state: { x: number; y: number; data: T; isTouch?: boolean } | null,
  ) => void;
  showTooltip: (event: ChartEvent, data: T) => void;
  hideTooltip: () => void;
  type: ChartProps<T>["type"];
  isMobile: boolean;

  resolveInteraction: (
    event: ChartEvent,
  ) => { element: Element; data: T } | null;
}

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
  animate?: boolean; // Defaults to true
}

// Legend types
export type LegendPosition = "top" | "bottom" | "left" | "right";

export interface LegendItem {
  label: string;
  color?: string; // CSS variable like "var(--primary)" - auto-assigned if not provided
}

export interface LegendConfig {
  data: LegendItem[];
  position?: {
    default?: LegendPosition; // Default: "top"
    mobile?: LegendPosition; // Default: "bottom"
  };
}

export interface ChartProps<T = unknown> {
  data: T[];
  type?: "line" | "area" | "bar";
  render?: (context: DrawContext<T>) => void;
  withFrame?: boolean;
  onValueChange?: (data: T | null) => void;
  variant?: "default" | "solid";
  x: (d: T) => string | number;
  y: (d: T) => number;
  d3Config?: ChartConfig;
  className?: string;
  style?: React.CSSProperties;
  renderTooltip?: (data: T) => React.ReactNode;
  flat?: boolean;
  title?: string | React.ReactNode;
  subtitle?: string;
  legend?: LegendConfig;
}
