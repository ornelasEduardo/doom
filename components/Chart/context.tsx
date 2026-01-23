import { createContext, useContext } from "react";

import {
  Accessor,
  ChartConfig,
  HoverState,
  LegendItem,
  SeriesContext,
  SeriesType,
} from "./types";

export interface ChartContextValue<T = unknown> {
  // Data
  data: T[];

  // Dimensions
  width: number;
  height: number;
  setWidth?: (width: number) => void;
  setHeight?: (height: number) => void;
  setPlotRef?: (ref: HTMLElement | null) => void; // Allow subcomponents to register the plot area
  isMobile: boolean;

  // Config
  config: ChartConfig & {
    margin: { top: number; right: number; bottom: number; left: number };
  };

  // Design system
  colorPalette: string[];
  styles: Record<string, string>;
  variant?: "default" | "solid";

  // Hover state (for tooltip and cursor positioning)
  activeData: T | null;
  setActiveData: (data: T | null) => void;

  // Interaction helpers
  resolveInteraction: (
    event: React.MouseEvent | React.TouchEvent,
  ) => { element: Element; data: T } | null;

  // Legend
  legendItems: LegendItem[];
  registerSeries?: (id: string, items: LegendItem[]) => number;
  unregisterSeries?: (id: string) => void;
  requestLayoutAdjustment?: (
    suggestedMargin: Partial<{
      top: number;
      right: number;
      bottom: number;
      left: number;
    }>,
  ) => void;

  // Legacy Legacy support
  // Some series might call showTooltip manually
  setHoverState?: (state: HoverState<T> | null) => void;
  hoverState?: HoverState<T> | null;

  // For shorthand API (optional - Series can override)
  type?: SeriesType;
  render?: (context: SeriesContext<T>) => void;
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
}

export const ChartContext = createContext<ChartContextValue<unknown> | null>(
  null,
);

export function useChartContext<T = unknown>() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("Chart components must be used within a Chart.Root");
  }
  return context as ChartContextValue<T>;
}
