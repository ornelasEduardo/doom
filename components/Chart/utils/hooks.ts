import { useEffect, useId } from "react";

import { useChartContext } from "../context";
import { Accessor } from "./accessors";

interface RegistrationProps<T> {
  label?: string;
  color?: string;
  y?: Accessor<T, number>;
  hideCursor?: boolean;
}

export function useSeriesRegistration<T>(props: RegistrationProps<T>) {
  const { registerSeries, unregisterSeries } = useChartContext();
  const id = useId();

  useEffect(() => {
    if (registerSeries) {
      registerSeries(id, [
        {
          label: props.label || "Series",
          color: props.color,
          yAccessor: props.y,
          hideCursor: props.hideCursor,
        },
      ]);
    }
    return () => {
      if (unregisterSeries) {
        unregisterSeries(id);
      }
    };
  }, [registerSeries, unregisterSeries, id, props.label, props.color, props.y]);

  return id;
}
