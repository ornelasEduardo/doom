import { useEffect, useId } from "react";

import { useChartContext } from "../context";
import {
  registerSeries,
  unregisterSeries,
} from "../state/store/stores/series/series.store";
import { Accessor } from "./accessors";

interface RegistrationProps<T> {
  label?: string;
  color?: string;
  y?: Accessor<T, number>;
  hideCursor?: boolean;
  interactionMode?: "x" | "xy";
}

export function useSeriesRegistration<T>(props: RegistrationProps<T>) {
  const { seriesStore } = useChartContext();
  const id = useId();

  useEffect(() => {
    registerSeries(seriesStore, id, [
      {
        label: props.label || "Series",
        color: props.color,
        yAccessor: props.y,
        hideCursor: props.hideCursor,
        interactionMode: props.interactionMode,
      },
    ]);
    return () => {
      unregisterSeries(seriesStore, id);
    };
  }, [
    seriesStore,
    id,
    props.label,
    props.color,
    props.y,
    props.hideCursor,
    props.interactionMode,
  ]);

  return id;
}
