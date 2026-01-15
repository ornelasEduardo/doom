import React from "react";

import { Chart } from "../../Chart/Chart";

interface ChartWrapperProps {
  xKey: string;
  yKey: string;
  config?: Record<string, { label: string; color: string }>;
  data: Record<string, unknown>[];
  [key: string]: unknown;
}

/**
 * ChartWrapper bridges A2UI's JSON-based API with the Chart component's function-based API.
 *
 * Since A2UI uses JSON (which can't contain functions), this wrapper converts:
 * - `xKey` (string) → `x` accessor function
 * - `yKey` (string) → `y` accessor function
 */
export const ChartWrapper: React.FC<ChartWrapperProps> = (props) => {
  const { xKey, yKey, config: _config, ...rest } = props;

  // Transform string keys to accessor functions
  const x = (d: Record<string, unknown>) => d[xKey] as string | number;
  const y = (d: Record<string, unknown>) => d[yKey] as number;

  return <Chart {...rest} x={x} y={y} />;
};
