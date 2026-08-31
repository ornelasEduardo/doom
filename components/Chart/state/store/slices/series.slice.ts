import { BinaryXStrategy } from "../../../sensors/utils/strategies/BinaryXStrategy/index";
import { LinearStrategy } from "../../../sensors/utils/strategies/LinearStrategy/index";
import { QuadtreeStrategy } from "../../../sensors/utils/strategies/QuadtreeStrategy/index";
import { Series } from "../../../types";

export interface SeriesSlice {
  series: Map<string, Series[]>;
  seriesConfigs: Map<string, any[]>;
  processedSeries: Series[];
}

export const getSeriesInitialState = (): SeriesSlice => ({
  series: new Map(),
  seriesConfigs: new Map(),
  processedSeries: [],
});

/**
 * Categorical palette for series that do not name their own colour.
 *
 * Theme tokens rather than fixed hex, so a series palette re-themes with the
 * rest of the system. Themes own the contrast relationship between these.
 */
export const SERIES_PALETTE = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
  "var(--chart-series-6)",
];

export const hydrateSeries = (
  props: any,
  index: number,
  defaultData: any[],
): Series => {
  const data = props.data || defaultData;

  const series: Series = {
    id: props.id || `series-${index}`,
    label: props.label || `Series ${index + 1}`,
    color: props.color || SERIES_PALETTE[index % SERIES_PALETTE.length],
    xAccessor: props.x as any,
    yAccessor: props.y as any,
    hideCursor: props.hideCursor,
    interactionMode: props.interactionMode,
    type: props.type,
    data,
  };

  if (!data || data.length === 0) {
    series.strategy = new LinearStrategy(series, []);
    return series;
  }

  // 1. Force Linear for small datasets (no overhead)
  if (data.length < 50) {
    series.strategy = new LinearStrategy(series, data);
    return series;
  }

  // 2. Scatter/Bubble -> Quadtree (Spatial)
  if (
    props.type === "scatter" ||
    props.type === "bubble" ||
    series.interactionMode === "xy"
  ) {
    series.strategy = new QuadtreeStrategy(series, data);
    return series;
  }

  // 3. Line/Area -> Binary Search (Assumes sorted X)
  // Note: Optimized for time-series and categorical data with monotonic X values.
  if (props.type === "line" || props.type === "area" || !props.type) {
    series.strategy = new BinaryXStrategy(series, data);
    return series;
  }

  // Fallback
  series.strategy = new LinearStrategy(series, data);

  return series;
};

export const combineSeries = (map: Map<string, Series[]>) => {
  const series: Series[] = [];
  map.forEach((val) => series.push(...val));
  return series;
};
