import { Config } from "../../../types";

export interface Dimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export interface DimensionsSlice {
  dimensions: Dimensions;
}

export const calculateInnerDimensions = (
  width: number,
  height: number,
  margin: Dimensions["margin"],
) => ({
  innerWidth: Math.max(0, width - margin.left - margin.right),
  innerHeight: Math.max(0, height - margin.top - margin.bottom),
});

export const getDimensionsInitialState = (config: Config): DimensionsSlice => {
  const defaultMargin =
    config.showAxes === false
      ? { top: 20, right: 10, bottom: 20, left: 10 }
      : { top: 20, right: 20, bottom: 40, left: 50 };

  const margin = config.margin || defaultMargin;

  const width = config.width || 0;
  const height = config.height || 0;
  const { innerWidth, innerHeight } = calculateInnerDimensions(
    width,
    height,
    margin,
  );

  return {
    dimensions: {
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
    },
  };
};
