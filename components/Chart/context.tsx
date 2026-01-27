import { createContext, useContext } from "react";

import { ContextValue } from "./types/context";

export const ChartContext = createContext<ContextValue<any> | null>(null);

export function useChartContext<T = any>() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("Chart subcomponents must be used within a <Chart />");
  }
  return context as ContextValue<T>;
}
