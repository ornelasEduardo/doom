"use client";

import { useEffect, useMemo, useRef } from "react";

import { useChartContext } from "../../context";
import {
  removeInteraction,
  upsertInteraction,
} from "../../state/store/chart.store";
import { ContextValue } from "../../types";
import { Sensor } from "../../types/events";
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
  const { chartStore, config, colorPalette, engine } = useChartContext();

  // Subscribe to status and data for lifecycle protection
  const status = chartStore.useStore((s) => s.status);
  const data = chartStore.useStore((s) => s.data);

  // Use a ref to access the latest colorPalette without triggering re-instantiation
  const colorPaletteRef = useRef(colorPalette);
  useEffect(() => {
    colorPaletteRef.current = colorPalette;
  }, [colorPalette]);

  const activeSensors = useMemo(() => {
    if (sensors && sensors.length > 0) {
      return sensors;
    }

    // Default injection
    const defaults: Sensor[] = [];
    const type = config.type || "line";

    if (["line", "area", "bar", "scatter", "bubble"].includes(type as string)) {
      defaults.push(
        DataHoverSensor({
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
          name: InteractionChannel.PRIMARY_HOVER, // exact mode handled by Engine/DataHover logic
        }),
      );
    }
    return defaults;
  }, [sensors, config.type]);

  useEffect(() => {
    // PROTECT: Only active when chart is READY.
    if (status !== "ready" || !data.length || !engine) {
      return;
    }

    // Define the sensor context
    // Note: Sensors are now stateless structure-wise, deriving state from Store/Context
    const sensorContext = {
      getChartContext: () => {
        const state = chartStore.getState();
        return {
          ...state,
          xScale: state.scales.x,
          yScale: state.scales.y,
          colorPalette: colorPaletteRef.current || [],
          chartStore,
        } as unknown as ContextValue<any>;
      },
      getInteraction: (name: string) => {
        return chartStore.getState().interactions.get(name) || null;
      },
      upsertInteraction: (name: string, value: any) => {
        upsertInteraction(chartStore, name, value);
      },
      removeInteraction: (name: string) => {
        removeInteraction(chartStore, name);
      },
    };

    // Register handler with Engine
    engine.setHandler((event) => {
      activeSensors.forEach((sensor) => {
        try {
          sensor(event, sensorContext);
        } catch (err) {
          console.error("Sensor Error:", err);
        }
      });
    });

    return () => {
      engine.setHandler(() => {});
    };
  }, [activeSensors, engine, chartStore, status, data.length]);

  return null;
};
