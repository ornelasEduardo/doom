import * as d3Shape from "d3-shape";

import { SeriesType } from "./common";

// =============================================================================
// CHART CONFIG
// =============================================================================

export interface ChartConfig {
  margin?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
  curve?: d3Shape.CurveFactory;
  showAxes?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  grid?: boolean;
  withGradient?: boolean;
  showDots?: boolean;
  hideYAxisDomain?: boolean;
  animate?: boolean;
  type?: SeriesType;
}
