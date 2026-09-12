"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import {
  EngineEvent,
  InputAction,
  InputSignal,
  InputSource,
} from "../../engine";
import { ContextValue } from "../../types";
import { Sensor, SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { createInteractionAccess } from "../../utils/interactionChannels";
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
  const hasData = data.length > 0;

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
    const baseline = KeyboardSensor();
    if (stableSensors && stableSensors.length > 0) {
      return { sensors: stableSensors, baseline };
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
    return { sensors: defaults, baseline };
  }, [stableSensors, config.type]);

  useEffect(() => {
    if (status !== "ready" || !hasData || !engine) {
      return;
    }

    const sensorContext: SensorContext<T> = {
      getChartContext: () => contextRef.current,
      ...createInteractionAccess(chartStore),
    };

    const dispatchEvent = (event: EngineEvent<T>) => {
      const dispatch = (sensor: Sensor<T>) => {
        if (engine.isInputCancelled(event.signal)) {
          return;
        }
        try {
          sensor(event, sensorContext);
        } catch (err) {
          console.error("Sensor Error:", err);
        }
      };
      activeSensors.sensors.forEach(dispatch);
      if (!event.claimed) {
        dispatch(activeSensors.baseline);
      }
    };
    engine.setHandler(dispatchEvent);

    const cancellationSignal = (): InputSignal => ({
      action: InputAction.CANCEL,
      cancelScope: "chart",
      id: 0,
      userId: "local",
      source: InputSource.KEYBOARD,
      x: 0,
      y: 0,
      timestamp: performance.now(),
    });
    const cancelSensors = () =>
      dispatchEvent({
        signal: cancellationSignal(),
        candidates: [],
        sliceCandidates: [],
        chartX: 0,
        chartY: 0,
        isWithinPlot: false,
      });
    // Disposal rejects input; deliver cleanup without depending on effect teardown order.
    const unsubscribe = engine.subscribeCancellation(() => {
      if (engine.isDisposed()) {
        cancelSensors();
      }
    });

    return () => {
      try {
        if (!engine.isDisposed()) {
          engine.input(cancellationSignal());
        }
      } finally {
        unsubscribe();
        engine.setHandler(() => {});
      }
    };
  }, [activeSensors, engine, chartStore, status, hasData]);

  return null;
};
