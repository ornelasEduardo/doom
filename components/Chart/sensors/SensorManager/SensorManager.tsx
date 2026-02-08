"use client";

import { useEffect, useMemo, useRef } from "react";

import { useChartContext } from "../../context";
import { useEventContext } from "../../state/EventContext";
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
  const { chartStore, config, colorPalette } = useChartContext();

  // Extract ONLY the stable callbacks from eventContext.
  // IMPORTANT: Do NOT depend on the entire eventContext object, as it changes
  // on every pointer move (due to pointerPosition state), which would cause
  // sensors to be re-instantiated and lose their closure state.
  const { on, off, emit } = useEventContext();

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

    // Instantiate sensors with stable callback references
    const cleanups = activeSensors.map((sensor) => {
      return sensor({
        on,
        off,
        emit,
        // These are not used by sensors directly - they subscribe to events instead
        pointerPosition: null,
        isWithinPlot: false,
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
      });
    });

    return () => {
      cleanups.forEach((cleanup) => {
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
    };
    // CRITICAL: Only depend on stable references (on, off, emit from useCallback)
    // NOT the entire eventContext object which changes on every pointer move
    // colorPalette is now accessed via ref to avoid re-instantiation
  }, [activeSensors, on, off, emit, chartStore, status, data.length]);

  return null;
};
