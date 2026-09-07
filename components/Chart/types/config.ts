import * as d3Shape from "d3-shape";

import { SeriesType } from "./common";

export interface AxisOptions {
  /** Format any axis value, including selected values between ticks. Also the default tick formatter. */
  valueFormat?: (value: string | number) => string;
  /** Format tick labels by candidate index, before collision removal. Selected tick values reuse these labels. */
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
