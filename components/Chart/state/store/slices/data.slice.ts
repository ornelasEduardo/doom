import { Accessor, Config, SeriesType } from "../../../types";

export interface DataSlice<T = any> {
  data: T[];
  config: Config;
  type: SeriesType;
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
}

export const getDataInitialState = (
  config: Config,
  x?: Accessor<any, string | number>,
  y?: Accessor<any, number>,
): DataSlice => ({
  data: [],
  config: config,
  type: config.type || "line",
  x,
  y,
});
