import { useEffect, useId } from "react";

import { useChartContext } from "../context";
import { registerSeries, unregisterSeries } from "../state/store/chart.store";
import { SERIES_PALETTE } from "../state/store/slices/series.slice";
import { Accessor } from "./accessors";

interface RegistrationProps<T> {
  label?: string;
  color?: string;
  y?: Accessor<T, number>;
  hideCursor?: boolean;
  interactionMode?: "x" | "xy";
}

export function useSeriesRegistration<T>(props: RegistrationProps<T>) {
  const { chartStore } = useChartContext();
  const id = useId();

  useEffect(() => {
    registerSeries(chartStore, id, [
      {
        label: props.label || "Series",
        color: props.color,
        y: props.y,
        hideCursor: props.hideCursor,
      },
    ]);
    return () => {
      unregisterSeries(chartStore, id);
    };
  }, [
    chartStore,
    id,
    props.label,
    props.color,
    props.y,
    props.hideCursor,
    props.interactionMode,
  ]);

  return id;
}

/**
 * The colour a series should draw itself in.
 *
 * A series registers with the colour it was given — possibly none — and the
 * store fills the gap from the categorical palette. Reading the resolved value
 * back keeps the mark, its points and the legend swatch in agreement.
 */
export const useSeriesColor = (
  chartStore: { useStore: <U>(selector: (s: any) => U) => U },
  seriesId: string,
  explicitColor?: string,
): string => {
  const registered = chartStore.useStore(
    (s: any) =>
      s.processedSeries?.find((series: any) => series.id === seriesId)?.color,
  ) as string | undefined;

  return explicitColor || registered || SERIES_PALETTE[0];
};
