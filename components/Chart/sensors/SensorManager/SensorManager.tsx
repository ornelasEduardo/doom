"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import {
  removeInteraction,
  upsertInteraction,
} from "../../state/store/chart.store";
import { ContextValue } from "../../types";
import { Sensor, SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { DataHoverSensor } from "../DataHoverSensor/DataHoverSensor";
import { KeyboardSensor } from "../KeyboardSensor";

/**
 * The SensorManager is a headless component that manages the lifecycle of
 * Chart Sensors. It coordinates event listeners, identifies default sensors
 * based on chart type if none are provided, and bridges normalized events
 * to the interaction store.
 */
interface SensorManagerProps<T> {
  sensors?: Sensor<T>[];
  value: ContextValue<T>;
}

export const SensorManager = <T,>({
  sensors,
  value,
}: SensorManagerProps<T>) => {
  const { chartStore, config, engine } = value;

  const status = chartStore.useStore((s) => s.status);
  const data = chartStore.useStore((s) => s.data);

  const contextRef = useRef(value);
  useLayoutEffect(() => {
    // Registered sensors must never observe context from an uncommitted render.
    contextRef.current = value;
  });

  // Consumers pass a fresh array literal every render. Keying off its identity
  // would re-register the whole set each time, discarding the closure state a
  // sensor like DragSensor holds mid-gesture.
  const sensorsRef = useRef<Sensor<T>[] | undefined>(sensors);
  const sameSensors =
    sensorsRef.current === sensors ||
    (!!sensorsRef.current &&
      !!sensors &&
      sensorsRef.current.length === sensors.length &&
      sensorsRef.current.every((s, i) => s === sensors[i]));

  if (!sameSensors) {
    sensorsRef.current = sensors;
  }
  const stableSensors = sensorsRef.current;

  const activeSensors = useMemo(() => {
    if (stableSensors && stableSensors.length > 0) {
      return [...stableSensors, KeyboardSensor()];
    }

    const defaults: Sensor<T>[] = [];
    const type = config.type || "line";

    if (["line", "area", "bar", "scatter", "bubble"].includes(type as string)) {
      const isVerticalSliceType = ["line", "area", "bar"].includes(
        type as string,
      );
      defaults.push(
        DataHoverSensor({
          name: InteractionChannel.PRIMARY_HOVER,
          verticalSlice: isVerticalSliceType,
        }),
      );
    } else {
      defaults.push(
        DataHoverSensor({
          name: InteractionChannel.PRIMARY_HOVER,
        }),
      );
    }
    defaults.push(KeyboardSensor());
    return defaults;
  }, [stableSensors, config.type]);

  useEffect(() => {
    if (status !== "ready" || !data.length || !engine) {
      return;
    }

    const sensorContext: SensorContext<T> = {
      getChartContext: () => contextRef.current,
      getInteraction: (name: string) => {
        return chartStore.getState().interactions.get(name) || null;
      },
      upsertInteraction: (name, value) => {
        upsertInteraction(chartStore, name, value);
      },
      removeInteraction: (name: string) => {
        removeInteraction(chartStore, name);
      },
    };

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
