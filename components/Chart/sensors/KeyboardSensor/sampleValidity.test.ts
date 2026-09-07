import { expect, it } from "vitest";

import { type EngineEvent, InputAction, InputSource } from "../../engine";
import {
  createChartStore,
  registerSeries,
  removeInteraction,
  updateChartState,
  upsertInteraction,
} from "../../state/store/chart.store";
import type { SensorContext } from "../../types/events";
import {
  type HoverInteraction,
  InteractionChannel,
} from "../../types/interaction";
import { KeyboardSensor } from "./KeyboardSensor";

it.each([false, true])(
  "skips missing and nonfinite keyboard targets with original indices (registered=%s)",
  (registered) => {
    const data = new Array<{ x: number; y: number | null }>(6);
    data[1] = { x: 1, y: null };
    data[2] = { x: 2, y: 0 };
    data[3] = { x: 3, y: Infinity };
    data[4] = { x: 4, y: 20 };
    const store = createChartStore({ width: 400, height: 300 }, "x", "y");
    updateChartState(store, { data, dimensions: store.getState().dimensions });
    if (registered) {
      registerSeries(store, "s", [{ id: "s", x: "x", y: "y" }]);
    }
    const context = {
      getChartContext: () => ({ chartStore: store }),
      upsertInteraction: (name: string, payload: unknown) =>
        upsertInteraction(store, name, payload),
      removeInteraction: (name: string) => removeInteraction(store, name),
    } as SensorContext;
    const event: EngineEvent = {
      signal: {
        action: InputAction.KEY,
        key: "ArrowRight",
        source: InputSource.KEYBOARD,
        id: 0,
        x: 0,
        y: 0,
        timestamp: 0,
        userId: "local",
      },
      candidates: [],
      sliceCandidates: [],
      chartX: 0,
      chartY: 0,
      isWithinPlot: true,
    };
    const sensor = KeyboardSensor();
    for (const index of [2, 4, 4]) {
      sensor({ ...event, signal: { ...event.signal } }, context);
      const hover = store
        .getState()
        .interactions.get(InteractionChannel.PRIMARY_HOVER) as HoverInteraction;
      expect(hover.targets.map((target) => target.dataIndex)).toEqual([index]);
      expect(hover.targets[0].data).toBe(data[index]);
    }
  },
);
