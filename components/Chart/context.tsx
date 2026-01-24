import { createContext, useContext } from "react";

import type { SeriesStore } from "./state/store/stores/series/series.store";
import {
  Accessor,
  ChartConfig,
  HoverState,
  SeriesContext,
  SeriesType,
} from "./types";

export interface ChartContextValue<T = unknown> {
  data: T[];

  width: number;
  height: number;
  setWidth?: (width: number) => void;
  setHeight?: (height: number) => void;
  setPlotRef?: (ref: HTMLElement | null) => void;
  isMobile: boolean;

  config: ChartConfig & {
    margin: { top: number; right: number; bottom: number; left: number };
  };

  colorPalette: string[];
  styles: Record<string, string>;
  variant?: "default" | "solid";

  resolveInteraction: (
    event: React.MouseEvent | React.TouchEvent,
  ) => { element: Element; data: T } | null;

  seriesStore: SeriesStore;

  requestLayoutAdjustment?: (
    suggestedMargin: Partial<{
      top: number;
      right: number;
      bottom: number;
      left: number;
    }>,
  ) => void;

  setHoverState?: (state: HoverState<T> | null) => void;
  hoverState?: HoverState<T> | null;

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
