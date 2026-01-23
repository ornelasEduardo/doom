import React from "react";

import { Accessor } from "./accessors";
import { SeriesType } from "./common";
import { ChartConfig } from "./config";
import { SeriesContext } from "./context";
import { ChartBehavior } from "./events";

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
