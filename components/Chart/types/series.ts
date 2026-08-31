import React from "react";

import { Accessor } from "./accessors";
import { SeriesType } from "./common";
import { RenderFrame } from "./context";

// =============================================================================
// SERIES PROPS - Per-series configuration
// =============================================================================

export interface SeriesProps<T> {
  // Chart type (optional when using render)
  type?: SeriesType;

  // Cartesian accessors - string or function
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;

  // Multivariate encoding
  size?: Accessor<T, number>;

  // Per-series data (optional, falls back to Chart data)
  data?: T[];

  // Styling (static colors)
  color?: string; // Single color for entire series
  label?: string;

  // Tooltip

  // Full D3 control - overrides type/x/y
  render?: (frame: RenderFrame<T>) => void;

  // Layout
  className?: string;
  style?: React.CSSProperties;

  // Behavior
  hideCursor?: boolean;
}

export interface Series {
  id: string;
  label: string;
  color: string;
  data?: any[];
  xAccessor?: Accessor<any, string | number>;
  yAccessor?: Accessor<any, number>;
  hideCursor?: boolean;
  interactionMode?: "x" | "xy";
  type?: SeriesType | string;
  strategy?: import("../sensors/utils/strategies/types").InteractionStrategy<any>;
}
