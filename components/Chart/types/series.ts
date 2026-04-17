import React from "react";

import { Accessor } from "./accessors";
import { SeriesType } from "./common";
import { RenderFrame } from "./context";

/**
 * Orientation a series declares for itself. Series that don't have a
 * meaningful orientation (Line, Scatter) leave this undefined.
 *
 * The chart store derives a chart-level orientation from registered series:
 * the first series that declares an orientation wins. Mixed orientations
 * within one chart fall back to the first declared with a console warning.
 */
export type SeriesOrientation = "vertical" | "horizontal";

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
  colorEncoding?: Accessor<T, string>; // Data-driven color encoding

  // Per-series data (optional, falls back to Chart data)
  data?: T[];

  // Styling (static colors)
  color?: string; // Single color for entire series
  stroke?: string;
  fill?: string;
  label?: string;

  // Tooltip

  // Full D3 control - overrides type/x/y
  render?: (frame: RenderFrame<T>) => void;

  // Layout
  className?: string;
  style?: React.CSSProperties;

  // Behavior
  hideCursor?: boolean;

  /**
   * Orientation declared by the series. Picked up by the chart store and
   * exposed for downstream components (axes, cursor, tooltip, grid) to
   * coordinate. Optional — only series whose rendering depends on
   * orientation (bars) need to set this.
   */
  orientation?: SeriesOrientation;
}

export interface Series {
  id: string;
  label: string;
  color: string;
  data?: any[];
  /** Position on the x-axis (physical). Use valueAccessor/categoryAccessor for semantic reads. */
  xAccessor?: Accessor<any, string | number>;
  /** Position on the y-axis (physical). Use valueAccessor/categoryAccessor for semantic reads. */
  yAccessor?: Accessor<any, number | string>;
  /**
   * Returns the numeric value being plotted, regardless of orientation.
   * For vertical bars: yAccessor. For horizontal bars: xAccessor.
   * Consumers (Tooltip, Axis, Cursor) should prefer this over xAccessor/yAccessor.
   */
  valueAccessor?: Accessor<any, number>;
  /**
   * Returns the categorical bucket the datum belongs to, regardless of orientation.
   * For vertical bars: xAccessor. For horizontal bars: yAccessor.
   */
  categoryAccessor?: Accessor<any, string | number>;
  hideCursor?: boolean;
  interactionMode?: "x" | "xy";
  type?: SeriesType | string;
  orientation?: SeriesOrientation;
  strategy?: import("../sensors/utils/strategies/types").InteractionStrategy<any>;
}
