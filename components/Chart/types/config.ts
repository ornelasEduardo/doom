import * as d3Shape from "d3-shape";

import { SeriesType } from "./common";

export interface Config {
  margin?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
  curve?: d3Shape.CurveFactory;
  showAxes?: boolean;
  xAxisLabel?: string;
  /** Format x-axis labels; numeric timestamps remain numeric scale values. */
  xTickFormat?: (value: string | number, index: number) => string;
  /** Positive maximum number of x-axis ticks; labels may be thinned further to fit. */
  xMaxTicks?: number;
  yAxisLabel?: string;
  grid?: boolean;
  withGradient?: boolean;
  showDots?: boolean;
  hideYAxisDomain?: boolean;
  type?: SeriesType;
}
