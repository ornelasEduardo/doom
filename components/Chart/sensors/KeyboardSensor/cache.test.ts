import { expect, it, vi } from "vitest";

import { Engine, EngineEvent, InputAction, InputSource } from "../../engine";
import {
  createChartStore,
  registerSeries,
  updateChartState,
} from "../../state/store/chart.store";
import type { SensorContext } from "../../types/events";
import { createInteractionAccess } from "../../utils/interactionChannels";
import { KeyboardSensor } from "./KeyboardSensor";

function setup() {
  const data = [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
    { x: 3, y: 30 },
  ];
  const store = createChartStore({ width: 600, height: 400 }, "x", "y");
  updateChartState(store, { data, dimensions: store.getState().dimensions });
  registerSeries(store, "s", [{ id: "s", type: "custom", x: "x", y: "y" }]);
  const engine = new Engine<(typeof data)[number]>({ useDomHitTesting: false });
  const points = data.map((data, dataIndex) => ({
    data,
    dataIndex,
    seriesId: "s",
    x: 100 + dataIndex * 50,
    y: 80,
  }));
  const owner = engine.registerGeometry(points);
  const access = createInteractionAccess(store);
  const context = {
    getChartContext: () => ({ chartStore: store, engine }),
    ...access,
  } as SensorContext<(typeof data)[number]>;
  const sensor = KeyboardSensor();
  const press = (key = "ArrowRight") =>
    sensor(
      {
        signal: {
          action: InputAction.KEY,
          source: InputSource.KEYBOARD,
          key,
          id: 0,
          userId: "local",
          x: 0,
          y: 0,
          timestamp: 0,
        },
        candidates: [],
        sliceCandidates: [],
        chartX: 0,
        chartY: 0,
        isWithinPlot: true,
      } as EngineEvent<(typeof data)[number]>,
      context,
    );
  return { data, store, engine, owner, points, access, press };
}

it("reuses owned navigation between keys and rebuilds after geometry movement or removal", () => {
  const { engine, owner, points, access, press } = setup();
  const resolve = vi.spyOn(engine, "resolveTargets");
  press();
  press();
  expect(access.getInteraction("primary-hover")?.target?.dataIndex).toBe(1);
  expect(resolve).toHaveBeenCalledTimes(1);
  owner.update(points.map((point) => ({ ...point, y: 140 })));
  press();
  expect(access.getInteraction("primary-hover")?.target?.coordinate.y).toBe(
    140,
  );
  expect(resolve).toHaveBeenCalledTimes(2);
  owner.dispose();
  press();
  expect(access.getInteraction("primary-hover")).toBeNull();
  engine.dispose();
});

it("invalidates navigation when data, layout, scales, or owner precedence changes", () => {
  const { engine, owner, points, access, press, store, data } = setup();
  const resolve = vi.spyOn(engine, "resolveTargets");
  press();
  press();
  expect(resolve).toHaveBeenCalledTimes(1);
  updateChartState(store, {
    data: [...data],
    dimensions: store.getState().dimensions,
  });
  press();
  expect(resolve).toHaveBeenCalledTimes(2);
  updateChartState(store, {
    data: store.getState().data,
    dimensions: {
      ...store.getState().dimensions,
      margin: { ...store.getState().dimensions.margin, left: 70 },
    },
  });
  press();
  expect(resolve).toHaveBeenCalledTimes(3);
  store.getState().scales.y!.range([200, 0]);
  press();
  expect(resolve).toHaveBeenCalledTimes(4);
  const replacement = engine.registerGeometry(
    points.map((point) => ({ ...point, y: 190 })),
  );
  press();
  expect(access.getInteraction("primary-hover")?.target?.coordinate.y).toBe(
    190,
  );
  expect(resolve).toHaveBeenCalledTimes(5);
  replacement.dispose();
  owner.dispose();
  engine.dispose();
});
