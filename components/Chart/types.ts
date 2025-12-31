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

export interface DrawContext<T> {
  g: D3Selection;
  data: T[];
  xScale: any;
  yScale: any;
  x: (d: T) => any;
  y: (d: T) => number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  config: ChartConfig;
  styles: Record<string, string>;
  gradientId: string;
  setHoverState: (state: { x: number; y: number; data: T } | null) => void;
  showTooltip: (event: any, data: T) => void;
  hideTooltip: () => void;
  type: ChartProps<T>["type"];
  isMobile: boolean;
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
}

export interface ChartProps<T = any> {
  data: T[];
  type?: "line" | "area" | "bar";
  render?: (context: DrawContext<T>) => void;
  withFrame?: boolean;
  onValueChange?: (data: T | null) => void;
  variant?: "default" | "solid";
  x: (d: T) => any;
  y: (d: T) => number;
  d3Config?: ChartConfig;
  className?: string;
  style?: React.CSSProperties;
  renderTooltip?: (data: T) => React.ReactNode;
  flat?: boolean;
  title?: string | React.ReactNode;
}
