import { InteractionStore } from "../state/store/stores/interaction/interaction.store";
import { ChartConfig } from "./config";
import { ChartNativeEvent } from "./interaction";
import { ChartXScale, ChartYScale } from "./scales";
import { D3Selection } from "./selection";

export interface RenderFrame<T = unknown> {
  /** The primary D3 container selection for this series */
  container: D3Selection<T>;

  /** Pre-calculated inner drawable dimensions and radius */
  size: {
    width: number;
    height: number;
    radius: number; // min(width, height) / 2
  };

  /** The generated D3 scales for x and y axes */
  scales: {
    x?: ChartXScale;
    y?: ChartYScale;
  };

  /** Theme and responsive state */
  theme: {
    colors: string[];
    isMobile: boolean;
  };

  /** Global chart configuration */
  config: ChartConfig;
}

export interface SeriesContext<T> extends RenderFrame<T> {
  // Legacy/Internal - to be phased out for behaviors
  g: D3Selection<T>;
  data: T[];

  // Direct dimensions
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };

  // Direct Scales
  xScale?: ChartXScale;
  yScale?: ChartYScale;

  // Direct Accessors
  x?: (d: T) => string | number;
  y?: (d: T) => number;

  // Direct Theme
  colors: string[];
  color?: string; // Legacy support
  styles: Record<string, string>;
  isMobile: boolean;

  // Interaction (Internal use only)
  interactionStore: InteractionStore;
  showTooltip: (event: ChartNativeEvent, data: T) => void;
  hideTooltip: () => void;
  resolveInteraction: (
    event: ChartNativeEvent,
  ) => { element: Element; data: T } | null;
}
