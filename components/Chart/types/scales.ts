import * as d3Scale from "d3-scale";

export type XScale =
  | d3Scale.ScaleLinear<number, number>
  | d3Scale.ScalePoint<string>
  | d3Scale.ScaleBand<string>
  | d3Scale.ScaleTime<number, number>;

export type YScale = d3Scale.ScaleLinear<number, number>;

export type Scale = XScale | YScale;
