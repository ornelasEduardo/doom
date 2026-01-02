import { createContext, useContext } from "react";

import { ChartConfig, LegendItem } from "./types";

export interface ChartContextValue<T = unknown> {
  data: T[];
  dimensions: {
    containerWidth: number;
    isMobile: boolean;
  };
  config: ChartConfig & {
    margin: { top: number; right: number; bottom: number; left: number };
  };
  colorPalette: string[];
  activeData: T | null;
  setActiveData: (data: T | null) => void;
  x: (d: T) => string | number;
  y: (d: T) => number;
  legendItems: LegendItem[];
  type?: "line" | "area" | "bar";
  render?: (context: any) => void;
  registerSeries?: (item: LegendItem) => () => void;
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
