import * as d3Scale from "d3-scale";

export type ChartXScale =
  | d3Scale.ScaleLinear<number, number>
  | d3Scale.ScalePoint<string>
  | d3Scale.ScaleBand<string>
  | d3Scale.ScaleTime<number, number>;

export type ChartYScale = d3Scale.ScaleLinear<number, number>;
