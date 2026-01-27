import { useEffect, useId } from "react";

import { useChartContext } from "../context";
import { registerSeries, unregisterSeries } from "../state/store/chart.store";
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
