import * as d3Shape from "d3-shape";

import { SeriesType } from "./common";

export interface AxisOptions {
  /** Format labels only; scale values and tooltip data are unchanged. */
  tickFormat?: (value: string | number, index: number) => string;
  /** Positive maximum tick count; labels may be thinned further to fit. */
  maxTicks?: number;
}

export interface Config {
  margin?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
  curve?: d3Shape.CurveFactory;
  showAxes?: boolean;
  xAxisLabel?: string;
  axes?: { x?: AxisOptions; y?: AxisOptions };
  yAxisLabel?: string;
  grid?: boolean;
  withGradient?: boolean;
  showDots?: boolean;
  hideYAxisDomain?: boolean;
  type?: SeriesType;
}
