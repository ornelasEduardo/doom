import { BinaryXStrategy } from "../../../sensors/utils/strategies/BinaryXStrategy/index";
import { LinearStrategy } from "../../../sensors/utils/strategies/LinearStrategy/index";
import { QuadtreeStrategy } from "../../../sensors/utils/strategies/QuadtreeStrategy/index";
import { Series, SeriesOrientation } from "../../../types";

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

const LEGEND_PALETTE = ["#2E93fA", "#66DA26", "#546E7A", "#E91E63", "#FF9800"];

export const hydrateSeries = (
  props: any,
  index: number,
  defaultData: any[],
): Series => {
  const data = props.data || defaultData;
  const isHorizontal = props.orientation === "horizontal";

  const series: Series = {
    id: props.id || `series-${index}`,
    label: props.label || `Series ${index + 1}`,
    color: props.color || LEGEND_PALETTE[index % LEGEND_PALETTE.length],
    xAccessor: props.x as any,
    yAccessor: props.y as any,
    valueAccessor: (isHorizontal ? props.x : props.y) as any,
    categoryAccessor: (isHorizontal ? props.y : props.x) as any,
    hideCursor: props.hideCursor,
    interactionMode: props.interactionMode,
    type: props.type,
    orientation: props.orientation,
    stackId: props.stackId,
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

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Derives the chart-level orientation from registered series.
 *
 * Rules:
 * - First series that declares an orientation wins
 * - If no series declares one, defaults to "vertical"
 * - Mixed orientations log a warning (in dev) but still return the first declared
 *
 * Used by axes, cursor, tooltip, and grid to coordinate horizontal vs
 * vertical layout without each component reaching into individual series.
 */
export const selectChartOrientation = (
  state: Pick<SeriesSlice, "processedSeries">,
): SeriesOrientation => {
  const declared = state.processedSeries
    .map((s) => s.orientation)
    .filter((o): o is SeriesOrientation => o !== undefined);

  if (declared.length === 0) {
    return "vertical";
  }

  const first = declared[0];

  if (process.env.NODE_ENV !== "production") {
    const conflicting = declared.some((o) => o !== first);
    if (conflicting) {
      console.warn(
        `[Chart] Mixed series orientations detected (${[...new Set(declared)].join(", ")}). ` +
          `Using "${first}" (first declared). Use a single orientation per chart.`,
      );
    }
  }

  return first;
};
