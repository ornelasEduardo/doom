import { Accessor, AxisValue, Config, SeriesType } from "../../../types";

export interface DataSlice<T = any> {
  data: T[];
  config: Config;
  type: SeriesType;
  x?: Accessor<T, AxisValue>;
  y?: Accessor<T, AxisValue>;
}

export const getDataInitialState = <T = any>(
  config: Config,
  x?: Accessor<T, AxisValue>,
  y?: Accessor<T, AxisValue>,
): DataSlice<T> => ({
  data: [],
  config: config,
  type: config.type || "line",
  x,
  y,
});
