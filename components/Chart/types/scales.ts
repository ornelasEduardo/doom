import * as d3Scale from "d3-scale";

export type XScale =
  | d3Scale.ScaleLinear<number, number>
  | d3Scale.ScalePoint<string>
  | d3Scale.ScaleBand<string | number>
  | d3Scale.ScaleTime<number, number>;

export type YScale =
  | d3Scale.ScaleLinear<number, number>
  | d3Scale.ScaleBand<string | number>;

export type Scale = XScale | YScale;
