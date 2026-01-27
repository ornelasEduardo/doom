import { Store } from "../state/store/chart.store";
import { Accessor, Config, SeriesType } from "./index";
import { XScale, YScale } from "./scales";
import { D3Selection } from "./selection";

export interface RenderFrame<T = unknown> {
  container: D3Selection<T>;
  data: T[];
  size: { width: number; height: number; radius: number };
  scales: { x?: XScale; y?: YScale };
  theme: { colors: string[]; isMobile: boolean };
  config: Config;
  resolveInteraction?: (
    event: React.MouseEvent | React.TouchEvent,
  ) => { element: Element; data: T } | null;
}

/**
 * Main context value for the Chart system.
 * Internal components use this via the useChartContext hook.
 */
export interface ContextValue<T = unknown> {
  chartStore: Store;
  config: Config;
  isMobile: boolean;
  colorPalette: string[];
  styles: Record<string, string>;
  variant?: "default" | "solid";

  resolveInteraction: (
    event: React.MouseEvent | React.TouchEvent,
  ) => { element: Element; data: T } | null;

  requestLayoutAdjustment?: (
    suggestedMargin: Partial<{
      top: number;
      right: number;
      bottom: number;
      left: number;
    }>,
  ) => void;

  type?: SeriesType;
  render?: (context: SeriesContext<T>) => void;
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
}

/**
 * Extended context provided to Series renderers.
 */
export interface SeriesContext<T> extends RenderFrame<T> {
  g: D3Selection<T>;
  data: T[];
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xScale?: XScale;
  yScale?: YScale;
  x?: (d: T) => string | number;
  y?: (d: T) => number;
  colors: string[];
  styles: Record<string, string>;
  isMobile: boolean;
  chartStore: Store;
}
