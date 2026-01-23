import * as d3Scale from "d3-scale";

export type ChartXScale =
  | d3Scale.ScaleLinear<number, number>
  | d3Scale.ScalePoint<string>
  | d3Scale.ScaleBand<string>;

export type ChartYScale = d3Scale.ScaleLinear<number, number>;
