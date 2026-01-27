import React from "react";

import { Accessor } from "./accessors";
import { SeriesType } from "./common";
import { Config } from "./config";
import { RenderFrame } from "./context";
import { Behavior, Sensor } from "./events";

export interface Props<T = unknown> {
  data: T[];
  d3Config?: Config;
  className?: string;
  style?: React.CSSProperties;
  onValueChange?: (data: T | null) => void;
  variant?: "default" | "solid";
  flat?: boolean;
  withFrame?: boolean;
  title?: string | React.ReactNode;
  subtitle?: string;
  withLegend?: boolean;
  children?: React.ReactNode;

  // For shorthand API - single series defined at root level
  type?: SeriesType;
  x?: Accessor<T, string | number>;
  y?: Accessor<T, number>;
  render?: (frame: RenderFrame<T>) => void;
  behaviors?: Behavior[];
  sensors?: Sensor[];
}
