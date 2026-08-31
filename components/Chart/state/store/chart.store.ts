import { Accessor, Config } from "../../types";
import { InteractionChannel } from "../../types/interaction";
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
 * Synchronizes the chart state from props (Data, Type, Dimensions).
 */
export const updateChartState = <T>(
  store: Store,
  props: { data: T[]; type?: string; dimensions: Dimensions },
) => {
  store.setState((prev) => {
    const { data, type, dimensions } = props;
    const { margin } = dimensions;

    // Recalculate inner dimensions based on new outer dimensions
    const { innerWidth, innerHeight } = calculateInnerDimensions(
      dimensions.width,
      dimensions.height,
      margin,
    );

    const nextDimensions = {
      ...dimensions,
      innerWidth,
      innerHeight,
    };

    // Recalculate scales based on new data/type/dimensions
    const nextScales = calculateScales(
      data,
      nextDimensions,
      { ...prev, type: type || prev.type } as State, // Use new type for calculation
    );

    // Re-hydrate series with new data
    // This is critical for real-time updates (e.g. drag interactions)
    // We must use the stored configs to re-create the series strategies with the fresh data
    const nextSeries = new Map();
    const currentConfigs = prev.seriesConfigs || new Map();

    currentConfigs.forEach((configs, id) => {
      const hydrated = configs.map((c, i) =>
        hydrateSeries(c, (prev.processedSeries.length || 0) + i, data),
      );
      nextSeries.set(id, hydrated);
    });

    // A hover points at a specific row. When the data is replaced the pointer
    // has not moved, but the row it resolved to may be gone — which would
    // leave the tooltip, markers and onValueChange reporting a datum that no
    // longer exists.
    //
    // Re-point rather than drop. A live chart re-supplies a fresh array on
    // every tick with new object identities but the same rows, and clearing
    // outright made the reading blink out from under the cursor. Rows are
    // matched by position, so the tooltip follows the updated value and is
    // only dropped when its row genuinely went away.
    let nextInteractions = prev.interactions;
    const hover = nextInteractions.get(InteractionChannel.PRIMARY_HOVER) as
      | { targets?: Array<{ dataIndex?: number; data?: unknown }> }
      | undefined;

    if (data !== prev.data && hover?.targets?.length) {
      const targets = hover.targets
        .map((target) => {
          const index = target.dataIndex;
          if (index === undefined || index < 0 || index >= data.length) {
            return null;
          }
          return { ...target, data: data[index] };
        })
        .filter(Boolean);

      nextInteractions = new Map(nextInteractions);
      if (targets.length) {
        nextInteractions.set(InteractionChannel.PRIMARY_HOVER, {
          ...hover,
          targets,
          target: targets[0],
        });
      } else {
        nextInteractions.delete(InteractionChannel.PRIMARY_HOVER);
      }
    }

    return {
      data,
      type: type || prev.type,
      dimensions: nextDimensions,
      scales: nextScales,
      series: nextSeries, // Update series map
      processedSeries: combineSeries(nextSeries), // Update flattened series
      interactions: nextInteractions,
      status:
        nextDimensions.width > 0 && nextDimensions.height > 0
          ? "ready"
          : "idle",
    } as Partial<State>;
  });
};

/**
 * Applies a new baseline margin from d3Config.
 *
 * Axis auto-layout adjusts the margin from whatever baseline is in the store,
 * so this sets the baseline and lets the next measurement re-adjust from it.
 */
export const updateChartMargin = (
  store: Store,
  margin: Dimensions["margin"],
) => {
  store.setState((prev) => {
    const { innerWidth, innerHeight } = calculateInnerDimensions(
      prev.dimensions.width,
      prev.dimensions.height,
      margin,
    );
    const nextDimensions = {
      ...prev.dimensions,
      margin,
      innerWidth,
      innerHeight,
    };
    return {
      dimensions: nextDimensions,
      scales: calculateScales(prev.data, nextDimensions, prev),
    } as Partial<State>;
  });
};

/**
 * Replaces the x/y accessors and re-derives the scales from them.
 *
 * Deliberately leaves `dimensions` untouched: Root subscribes to that slice, so
 * writing a fresh dimensions object here would re-render Root, re-run the sync
 * effect and loop.
 */
export const updateChartAccessors = <T>(
  store: Store,
  next: {
    x?: Accessor<T, string | number>;
    y?: Accessor<T, number>;
  },
) => {
  store.setState((prev) => {
    const merged = { ...prev, ...next } as State;
    return {
      x: next.x,
      y: next.y,
      scales: calculateScales(prev.data, prev.dimensions, merged),
    } as Partial<State>;
  });
};

/**
 * Registers a series id and its configurations.
 * Often called by the `<Series />` component or sub-series layers.
 */
export const registerSeries = (store: Store, id: string, configs: any[]) => {
  store.setState((state) => {
    const nextSeries = new Map(state.series);
    const nextConfigs = new Map(state.seriesConfigs); // Clone configs map

    // Store raw configs for future re-hydration
    nextConfigs.set(id, configs);

    // Palette slot follows the series' registration order, not the current
    // series count — otherwise re-registering an existing series (an effect
    // re-run) would shift its index and change its colour.
    const slot = Array.from(nextConfigs.keys()).indexOf(id);
    const hydrated = configs.map((c, i) =>
      hydrateSeries(c, slot + i, state.data),
    );
    nextSeries.set(id, hydrated);

    return {
      series: nextSeries,
      seriesConfigs: nextConfigs,
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
    const nextConfigs = new Map(state.seriesConfigs);

    nextSeries.delete(id);
    nextConfigs.delete(id);

    return {
      series: nextSeries,
      seriesConfigs: nextConfigs,
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
