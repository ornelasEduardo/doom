import { SeriesType } from "./common";
import { ChartConfig } from "./config";
import { ChartNativeEvent, HoverState } from "./interaction";
import { ChartXScale, ChartYScale } from "./scales";
import { D3Selection } from "./selection";

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
  activeData: T | null;
  setHoverState: (state: HoverState<T> | null) => void;

  // Interaction helper
  resolveInteraction: (
    event: ChartNativeEvent,
  ) => { element: Element; data: T } | null;
}
