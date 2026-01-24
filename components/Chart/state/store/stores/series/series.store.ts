import { useChartContext } from "../../../../context";
import { Series, SeriesProps } from "../../../../types";
import { createStore, StoreApi } from "../../createStore";

export interface SeriesState {
  series: Map<string, Series[]>;
  processedSeries: Series[];
}

export type SeriesStore = StoreApi<SeriesState>;

const LEGEND_PALETTE = ["#2E93fA", "#66DA26", "#546E7A", "#E91E63", "#FF9800"];

export const createSeriesStore = () =>
  createStore<SeriesState>({
    series: new Map(),
    processedSeries: [],
  });

const processSeries = (map: Map<string, Series[]>) => {
  const series: Series[] = [];
  map.forEach((val) => series.push(...val));
  return series;
};

const hydrateSeries = (props: SeriesProps<any>, index: number): Series => {
  return {
    id: (props as any).id || `series-${index}`,
    label: props.label || `Series ${index + 1}`,
    color: props.color || LEGEND_PALETTE[index % LEGEND_PALETTE.length],
    yAccessor: props.y as any,
    hideCursor: props.hideCursor,
    interactionMode: (props as any).interactionMode,
  };
};

export const registerSeries = (
  store: SeriesStore,
  id: string,
  configs: SeriesProps<any>[],
) => {
  store.setState((state) => {
    const nextSeries = new Map(state.series);
    const hydrated = configs.map((c, i) =>
      hydrateSeries(c, (state.processedSeries.length || 0) + i),
    );
    nextSeries.set(id, hydrated);

    const derived = processSeries(nextSeries);

    return {
      series: nextSeries,
      processedSeries: derived,
    };
  });
};

export const unregisterSeries = (store: SeriesStore, id: string) => {
  store.setState((state) => {
    if (!state.series.has(id)) {
      return {};
    }

    const nextSeries = new Map(state.series);
    nextSeries.delete(id);

    return {
      series: nextSeries,
      processedSeries: processSeries(nextSeries),
    };
  });
};

export const useSeries = () => {
  const { seriesStore } = useChartContext();
  return seriesStore.useStore((state) => state.processedSeries);
};
