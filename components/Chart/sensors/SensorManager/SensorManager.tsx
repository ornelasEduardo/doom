"use client";

import { useEffect, useMemo } from "react";

import { useChartContext } from "../../context";
import { useEventContext } from "../../state/EventContext";
import {
  removeInteraction,
  upsertInteraction,
} from "../../state/store/chart.store";
import { SeriesContext } from "../../types";
import { InteractionChannel } from "../../types/interaction";
import { DataHoverSensor } from "../DataHoverSensor/DataHoverSensor";
import { KeyboardSensor } from "../KeyboardSensor";

/**
 * The SensorManager is a headless component that manages the lifecycle of
 * Chart Sensors. It coordinates event listeners, identifies default sensors
 * based on chart type if none are provided, and bridges normalized events
 * to the interaction store.
 */
export const SensorManager = ({ sensors }: { sensors?: Sensor[] }) => {
  const { chartStore, config } = useChartContext();
  const eventContext = useEventContext();

  // Subscribe to status and data for lifecycle protection
  const status = chartStore.useStore((s) => s.status);
  const data = chartStore.useStore((s) => s.data);

  const activeSensors = useMemo(() => {
    if (sensors && sensors.length > 0) {
      return sensors;
    }

    // Default injection
    const defaults: Sensor[] = [];
    const type = config.type || "line";

    if (["line", "area", "bar", "scatter", "bubble"].includes(type as string)) {
      const mode =
        type === "scatter" || (type as string) === "bubble"
          ? "closest"
          : "nearest-x";
      defaults.push(
        DataHoverSensor({
          mode,
          name: InteractionChannel.PRIMARY_HOVER,
        }),
      );

      // A11y: Always include keyboard sensor for line/bar/scatter
      defaults.push(
        KeyboardSensor({
          name: InteractionChannel.PRIMARY_HOVER,
        }),
      );
    } else {
      defaults.push(
        DataHoverSensor({
          mode: "exact",
          name: InteractionChannel.PRIMARY_HOVER,
        }),
      );
    }
    return defaults;
  }, [sensors, config.type]);

  useEffect(() => {
    // PROTECT: Only instantiate sensors when the chart is READY.
    if (status !== "ready" || !data.length) {
      return;
    }

    // Instantiate sensors
    const cleanups = activeSensors.map((sensor) => {
      return sensor({
        on: eventContext.on,
        off: eventContext.off,
        emit: eventContext.emit,
        pointerPosition: eventContext.pointerPosition,
        isWithinPlot: eventContext.isWithinPlot,
        getChartContext: () => {
          const state = chartStore.getState();
          return {
            ...state,
            xScale: state.scales.x,
            yScale: state.scales.y,
            chartStore,
          } as unknown as SeriesContext<any>;
        },

        getInteraction: (name) => {
          return chartStore.getState().interactions.get(name) || null;
        },
        upsertInteraction: (name, value) => {
          upsertInteraction(chartStore, name, value);
        },
        removeInteraction: (name) => {
          removeInteraction(chartStore, name);
        },
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [activeSensors, eventContext, chartStore, status, data.length]);

  return null;
};
