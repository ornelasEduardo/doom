import { Accessor, AxisDomain, Config } from "../../types";
import { InteractionChannel } from "../../types/interaction";
import { resolveAccessor } from "../../utils/accessors";
import { barGeometry, categoryAccessor, stackSeries } from "../../utils/bars";
import { d3 } from "../../utils/d3";
import { clipRectToPlot, isPointInPlot } from "../../utils/plotBounds";
import {
  createScales,
  hasDomainOverride,
  resolveDomain,
} from "../../utils/scales";
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
    ScalesSlice {
  xDomain?: AxisDomain;
  yDomain?: AxisDomain;
}

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
  y?: Accessor<any, string | number>,
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
      interactions: refreshHover(
        { ...prev, dimensions: nextDimensions },
        prev.data,
        prev.processedSeries,
        nextScales,
      ),
    };
  });
};

/**
 * Updates the raw data used by the chart.
 * Triggers a re-calculation of global scales.
 */
export const updateChartData = <T>(store: Store, data: T[]) => {
  store.setState((prev) => {
    const derived = hydrateConfigs(prev, data);
    const nextScales = calculateScales(data, prev.dimensions, {
      ...prev,
      ...derived,
    });
    return {
      data,
      ...derived,
      scales: nextScales,
      interactions: refreshHover(
        prev,
        data,
        derived.processedSeries,
        nextScales,
      ),
    };
  });
};

/**
 * Synchronizes the chart state from props (Data, Type, Dimensions).
 */
export const updateChartState = <T>(
  store: Store,
  props: {
    data: T[];
    type?: string;
    dimensions: Dimensions;
    xDomain?: AxisDomain;
    yDomain?: AxisDomain;
  },
) => {
  store.setState((prev) => {
    const { data, type, dimensions, xDomain, yDomain } = props;
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

    const derived = hydrateConfigs(prev, data);
    const nextScales = calculateScales(data, nextDimensions, {
      ...prev,
      ...derived,
      type: (type || prev.type) as State["type"],
      xDomain,
      yDomain,
    });

    const nextInteractions = refreshHover(
      { ...prev, dimensions: nextDimensions, xDomain, yDomain },
      data,
      derived.processedSeries,
      nextScales,
    );

    return {
      data,
      type: type || prev.type,
      xDomain,
      yDomain,
      dimensions: nextDimensions,
      scales: nextScales,
      ...derived,
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
    const nextScales = calculateScales(prev.data, nextDimensions, prev);
    return {
      dimensions: nextDimensions,
      scales: nextScales,
      interactions: refreshHover(
        { ...prev, dimensions: nextDimensions },
        prev.data,
        prev.processedSeries,
        nextScales,
      ),
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
    y?: Accessor<T, string | number>;
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
    const firstBar = combineSeries(nextSeries).find(
      (series) => series.type === "bar" && series.orientation !== undefined,
    );
    if (
      firstBar &&
      combineSeries(nextSeries).some(
        (series) =>
          series.type === "bar" &&
          series.orientation !== undefined &&
          series.orientation !== firstBar.orientation,
      )
    ) {
      console.warn(
        "Chart.Series: incompatible bar orientation; all bars must share an orientation. The later series is omitted.",
      );
    }

    const processedSeries = stackSeries(combineSeries(nextSeries));
    const scales = [...state.processedSeries, ...processedSeries].some(
      (series) => series.type === "bar",
    )
      ? calculateScales(state.data, state.dimensions, {
          ...state,
          processedSeries,
        })
      : state.scales;
    return {
      series: nextSeries,
      seriesConfigs: nextConfigs,
      processedSeries,
      scales,
      interactions: refreshHover(state, state.data, processedSeries, scales),
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

    const processedSeries = stackSeries(combineSeries(nextSeries));
    const scales = [...state.processedSeries, ...processedSeries].some(
      (series) => series.type === "bar",
    )
      ? calculateScales(state.data, state.dimensions, {
          ...state,
          processedSeries,
        })
      : state.scales;
    return {
      series: nextSeries,
      seriesConfigs: nextConfigs,
      processedSeries,
      scales,
      interactions: refreshHover(state, state.data, processedSeries, scales),
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

const refreshHover = (
  state: State,
  data: unknown[],
  series: State["processedSeries"],
  scales: State["scales"],
) => {
  const hover = state.interactions.get(InteractionChannel.PRIMARY_HOVER) as
    | import("../../types").HoverInteraction
    | undefined;
  if (!hover?.targets?.length) {
    return state.interactions;
  }
  const bounded =
    hasDomainOverride(scales.x, state.xDomain) ||
    hasDomainOverride(scales.y, state.yDomain);
  const targets = hover.targets.flatMap((target) => {
    const item = series.find((item) => item.id === target.seriesId);
    const wasRegistered = state.processedSeries.some(
      (item) => item.id === target.seriesId,
    );
    if (
      wasRegistered &&
      !item &&
      state.processedSeries.find((item) => item.id === target.seriesId)
        ?.type === "bar"
    ) {
      return [];
    }
    const rows = item?.data ?? data;
    const index = target.dataIndex;
    if (index === undefined || index < 0 || index >= rows.length) {
      return [];
    }
    const datum = rows[index];
    const geometry =
      item?.type === "bar" && scales.x && scales.y
        ? barGeometry(item, datum, index, scales.x, scales.y)
        : null;
    const bar =
      geometry && bounded
        ? clipRectToPlot(geometry, state.dimensions)
        : geometry;
    if (!scales.x || !scales.y || (item?.type === "bar" && !bar)) {
      return [];
    }
    const xAccessor = item ? item.xAccessor : state.x;
    const yAccessor = item ? item.yAccessor : state.y;
    const coordinate = bar
      ? { x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 }
      : {
          x: (scales.x as (value: unknown) => number)(
            xAccessor ? resolveAccessor(xAccessor)(datum) : index,
          ),
          y: (scales.y as (value: unknown) => number)(
            yAccessor ? resolveAccessor(yAccessor)(datum) : datum,
          ),
        };
    if (bounded && !isPointInPlot(coordinate, state.dimensions)) {
      return [];
    }
    return [
      {
        ...target,
        data: datum,
        coordinate: {
          x: coordinate.x + state.dimensions.margin.left,
          y: coordinate.y + state.dimensions.margin.top,
        },
      },
    ];
  });
  const interactions = new Map(state.interactions);
  if (targets.length) {
    interactions.set(InteractionChannel.PRIMARY_HOVER, {
      ...hover,
      targets,
      target: targets[0],
    });
  } else {
    interactions.delete(InteractionChannel.PRIMARY_HOVER);
  }
  return interactions;
};

const hydrateConfigs = (state: State, data: unknown[]) => {
  const series = new Map<string, import("../../types").Series[]>();
  let slot = 0;
  state.seriesConfigs.forEach((configs, id) => {
    series.set(
      id,
      configs.map((config) => hydrateSeries(config, slot++, data)),
    );
  });
  return { series, processedSeries: stackSeries(combineSeries(series)) };
};

const calculateScales = (data: any[], dims: Dimensions, state: State) => {
  const scales = deriveScales(data, dims, state);
  if (scales.x && "invert" in scales.x) {
    scales.x.domain(
      resolveDomain(scales.x.domain() as number[], state.xDomain),
    );
  }
  if (scales.y && "invert" in scales.y) {
    scales.y.domain(
      resolveDomain(scales.y.domain() as number[], state.yDomain),
    );
  }
  return scales;
};

const deriveScales = (data: State["data"], dims: Dimensions, state: State) => {
  const bars = state.processedSeries.filter((series) => series.type === "bar");
  if (bars.length && dims.width > 0 && dims.height > 0) {
    const horizontal = bars[0].orientation === "horizontal";
    const compatible = bars.filter(
      (series) => (series.orientation === "horizontal") === horizontal,
    );
    const categories = compatible.flatMap((series) => {
      const accessor = categoryAccessor(series);
      return accessor ? (series.data ?? []).map(resolveAccessor(accessor)) : [];
    });
    const totals = compatible.flatMap(
      (series) => series.stackRanges?.flat() ?? [],
    );
    const min = Math.min(0, d3.min(totals) ?? 0);
    const max = Math.max(0, d3.max(totals) ?? 0);
    const numeric = d3
      .scaleLinear()
      .domain([min * 1.1, max * 1.1 || (min === 0 ? 1 : 0)])
      .nice()
      .range(horizontal ? [0, dims.innerWidth] : [dims.innerHeight, 0]);
    if (
      !horizontal &&
      (state.type !== "bar" ||
        state.processedSeries.some((series) => series.type !== "bar")) &&
      data.length &&
      state.x &&
      state.y
    ) {
      const base = createScales(
        data,
        dims.width,
        dims.height,
        dims.margin,
        resolveAccessor(state.x),
        (datum) => Number(resolveAccessor(state.y!)(datum)),
        state.type,
      );
      const otherSeries = state.processedSeries.filter(
        (series) => series.type !== "bar",
      );
      const extraValues = otherSeries
        .flatMap((series) =>
          series.yAccessor
            ? (series.data ?? []).map((datum) =>
                Number(resolveAccessor(series.yAccessor!)(datum)),
              )
            : [],
        )
        .filter(Number.isFinite);
      const bounds = base.yScale.domain();
      base.yScale
        .domain([
          Math.min(bounds[0], min * 1.1, d3.min(extraValues) ?? 0),
          Math.max(bounds[1], max * 1.1, d3.max(extraValues) ?? 0),
        ])
        .nice();
      const extras = otherSeries.flatMap((series) =>
        series.xAccessor
          ? (series.data ?? []).map(resolveAccessor(series.xAccessor))
          : [],
      );
      if (!("ticks" in base.xScale)) {
        base.xScale.domain(
          Array.from(
            new Set([...base.xScale.domain(), ...categories, ...extras]),
          ) as string[],
        );
      } else {
        const values = [...base.xScale.domain(), ...categories, ...extras]
          .map(Number)
          .filter(Number.isFinite);
        base.xScale.domain([d3.min(values) ?? 0, d3.max(values) ?? 1]);
      }
      return { x: base.xScale, y: base.yScale };
    }
    const category = d3
      .scaleBand<string | number>()
      .domain(categories)
      .range(horizontal ? [0, dims.innerHeight] : [0, dims.innerWidth])
      .padding(0.1);
    return horizontal
      ? { x: numeric, y: category }
      : { x: category, y: numeric };
  }
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
    (datum) => Number(resolveAccessor(state.y!)(datum)),
    state.type as any,
  );

  return {
    x: scales.xScale,
    y: scales.yScale,
  };
};
