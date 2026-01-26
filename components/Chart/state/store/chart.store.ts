import { Accessor, Config } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { createScales } from "../../utils/scales";
import { createStore, StoreApi } from "./createStore";
import { DataSlice, getDataInitialState } from "./slices/data.slice";
import {
  calculateInnerDimensions,
  Dimensions,
  DimensionsSlice,
  getDimensionsInitialState,
} from "./slices/dimensions.slice";
import {
  getInteractionsInitialState,
  InteractionsSlice,
} from "./slices/interactions.slice";
import {
  getLifecycleInitialState,
  LifecycleSlice,
  Status,
} from "./slices/lifecycle.slice";
import { getScalesInitialState, ScalesSlice } from "./slices/scales.slice";
import {
  combineSeries,
  getSeriesInitialState,
  hydrateSeries,
  SeriesSlice,
} from "./slices/series.slice";

export type { Dimensions, Status };

/**
 * The unified State of the Chart system.
 */
export interface State<T = any>
  extends
    LifecycleSlice,
    DimensionsSlice,
    DataSlice<T>,
    SeriesSlice,
    InteractionsSlice,
    ScalesSlice {}

/**
 * The Store type for the Chart system.
 */
export type Store = StoreApi<State>;

/**
 * Creates a unified Chart Store using the Slice Pattern.
 */
export const createChartStore = (
  initialConfig: Config,
  x?: Accessor<any, string | number>,
  y?: Accessor<any, number>,
) => {
  const dimensionsSlice = getDimensionsInitialState(initialConfig);
  const dataSlice = getDataInitialState(initialConfig, x, y);
  const seriesSlice = getSeriesInitialState();
  const interactionSlice = getInteractionsInitialState();
  const lifecycleSlice = getLifecycleInitialState();
  const scalesSlice = getScalesInitialState();

  return createStore<State>({
    ...lifecycleSlice,
    ...dimensionsSlice,
    ...dataSlice,
    ...seriesSlice,
    ...interactionSlice,
    ...scalesSlice,
  });
};

/**
 * Updates the chart's total dimensions (viewbox).
 * This will trigger a re-calculation of internal innerDimensions
 * and all derived scales.
 */
export const updateChartDimensions = (
  store: Store,
  width: number,
  height: number,
) => {
  store.setState((prev) => {
    const { margin } = prev.dimensions;
    const { innerWidth, innerHeight } = calculateInnerDimensions(
      width,
      height,
      margin,
    );

    const nextDimensions = {
      ...prev.dimensions,
      width,
      height,
      innerWidth,
      innerHeight,
    };

    // Derived state: calculate scales only once
    const nextScales = calculateScales(prev.data, nextDimensions, prev);

    return {
      status: width > 0 && height > 0 ? "ready" : "idle",
      dimensions: nextDimensions,
      scales: nextScales,
    };
  });
};

/**
 * Updates the raw data used by the chart.
 * Triggers a re-calculation of global scales.
 */
export const updateChartData = <T>(store: Store, data: T[]) => {
  store.setState((prev) => {
    const nextScales = calculateScales(data, prev.dimensions, prev);
    return { data, scales: nextScales };
  });
};

/**
 * Registers a series id and its configurations.
 * Often called by the `<Series />` component or sub-series layers.
 */
export const registerSeries = (store: Store, id: string, configs: any[]) => {
  store.setState((state) => {
    const nextSeries = new Map(state.series);
    const hydrated = configs.map((c, i) =>
      hydrateSeries(c, (state.processedSeries.length || 0) + i, state.data),
    );
    nextSeries.set(id, hydrated);
    return {
      series: nextSeries,
      processedSeries: combineSeries(nextSeries),
    };
  });
};

export const unregisterSeries = (store: Store, id: string) => {
  store.setState((state) => {
    if (!state.series.has(id)) {
      return state;
    }
    const nextSeries = new Map(state.series);
    nextSeries.delete(id);
    return {
      series: nextSeries,
      processedSeries: combineSeries(nextSeries),
    };
  });
};

/**
 * Updates or inserts a named interaction into the store.
 */
export const upsertInteraction = (store: Store, name: string, payload: any) => {
  store.setState((state) => {
    const nextInteractions = new Map(state.interactions);
    nextInteractions.set(name, payload);
    return { interactions: nextInteractions };
  });
};

export const removeInteraction = (store: Store, name: string) => {
  store.setState((state) => {
    if (!state.interactions.has(name)) {
      return state;
    }
    const nextInteractions = new Map(state.interactions);
    nextInteractions.delete(name);
    return { interactions: nextInteractions };
  });
};

// --- Internal Utilities ---

const calculateScales = (data: any[], dims: Dimensions, state: State) => {
  if (
    !data?.length ||
    dims.width <= 0 ||
    dims.height <= 0 ||
    !state.x ||
    !state.y
  ) {
    return { x: null, y: null };
  }

  const scales = createScales(
    data,
    dims.width,
    dims.height,
    dims.margin,
    resolveAccessor(state.x),
    resolveAccessor(state.y),
    state.type as any,
  );

  return {
    x: scales.xScale,
    y: scales.yScale,
  };
};
