import { expect, it, vi } from "vitest";

import {
  Engine,
  type EngineEvent,
  InputAction,
  InputSource,
} from "../../engine";
import { buildGrid } from "../../engine/PreparedGrid";
import {
  createChartStore,
  registerSeries,
  updateChartState,
} from "../../state/store/chart.store";
import type { SensorContext } from "../../types/events";
import { createInteractionAccess } from "../../utils/interactionChannels";
import { KeyboardSensor } from "./KeyboardSensor";

it.each(["custom", "line"] as const)(
  "prefers owned %s coordinates and data before accessor eligibility",
  (type) => {
    const data = [
      { x: 200, y: 200 },
      { x: 50, y: 50 },
    ];
    const store = createChartStore({ width: 600, height: 400 }, "x", "y");
    updateChartState(store, {
      data,
      dimensions: store.getState().dimensions,
      xDomain: [0, 100],
      yDomain: [0, 100],
    });
    registerSeries(store, "series", [{ id: "series", type, x: "x", y: "y" }]);
    const engine = new Engine({ useDomHitTesting: false });
    const published = { x: 300, y: 300 };
    const owner = engine.registerGeometry([
      {
        x: 150,
        y: 90,
        data: published,
        seriesId: "series",
        dataIndex: 0,
        suppressMarker: true,
      },
    ]);
    const access = createInteractionAccess(store);
    const context = {
      getChartContext: () => ({ chartStore: store, engine }),
      ...access,
    } as SensorContext;
    const sensor = KeyboardSensor();
    const press = () =>
      sensor(
        {
          signal: {
            action: InputAction.KEY,
            source: InputSource.KEYBOARD,
            key: "ArrowRight",
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
        } as EngineEvent,
        context,
      );
    press();
    const target = access.getInteraction("primary-hover")!.target!;
    expect(target).toMatchObject({
      dataIndex: 0,
      coordinate: { x: 150, y: 90 },
      suppressMarker: true,
    });
    expect(target.data).toBe(published);
    expect(target.geometryOwner).toBeDefined();
    if (type === "custom") {
      press();
      expect(access.getInteraction("primary-hover")!.target!.dataIndex).toBe(0);
      owner.update([]);
      press();
      expect(access.getInteraction("primary-hover")).toBeNull();
      owner.dispose();
      press();
      expect(access.getInteraction("primary-hover")).toBeNull();
    }
  },
);

it.each(["unpublished", "dom-only"] as const)(
  "scans tagged DOM at most once per keyboard input for %s custom rows",
  (mode) => {
    const count = 400;
    const data = Array.from({ length: count }, (_, x) => ({ x, y: 10 }));
    const store = createChartStore({ width: 600, height: 400 }, "x", "y");
    updateChartState(store, { data, dimensions: store.getState().dimensions });
    registerSeries(store, "custom", [
      { id: "custom", type: "custom", x: "x", y: "y" },
    ]);
    const engine = new Engine({ useDomHitTesting: false });
    const container = document.createElement("div");
    const marks = data.map((datum, index) => {
      const mark = document.createElement("span");
      mark.setAttribute("data-chart-type", "data-point");
      mark.setAttribute(
        "data-chart-series",
        mode === "dom-only" ? "custom" : "other",
      );
      mark.setAttribute("data-chart-index", String(index));
      Object.assign(mark, { __data__: datum });
      container.append(mark);
      return mark;
    });
    engine.setContainer(container);
    if (mode === "unpublished") {
      engine.registerGeometry([
        { x: 150, y: 90, data: data[0], seriesId: "custom", dataIndex: 0 },
      ]);
    }
    const queries = vi.spyOn(container, "querySelectorAll");
    const attributes = marks.map((mark) => vi.spyOn(mark, "getAttribute"));
    const access = createInteractionAccess(store);
    const context = {
      getChartContext: () => ({ chartStore: store, engine }),
      ...access,
    } as SensorContext;
    const sensor = KeyboardSensor();
    const press = () =>
      sensor(
        {
          signal: {
            action: InputAction.KEY,
            source: InputSource.KEYBOARD,
            key: "ArrowRight",
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
        },
        context,
      );
    press();
    expect(access.getInteraction("primary-hover")!.target!.data).toBe(data[0]);
    expect(queries).toHaveBeenCalledTimes(1);
    const identityReads = attributes
      .flatMap((spy) => spy.mock.calls)
      .filter(([name]) => name === "data-chart-series").length;
    expect(identityReads).toBeLessThanOrEqual(count * 2);
    queries.mockClear();
    if (mode === "dom-only") {
      const replacement = { x: 1, y: 99 };
      Object.assign(marks[1], { __data__: replacement });
      press();
      expect(access.getInteraction("primary-hover")!.target!.data).toBe(
        replacement,
      );
    } else {
      press();
      expect(access.getInteraction("primary-hover")!.target!.dataIndex).toBe(0);
    }
    expect(queries).toHaveBeenCalledTimes(1);
  },
);

it("keeps ordinary keyboard slices and traverses multiple lazy owners with colliding row indices", () => {
  const store = createChartStore({ width: 600, height: 400 }, "x", "y");
  updateChartState(store, {
    data: [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
    ],
    dimensions: store.getState().dimensions,
  });
  const engine = new Engine({ useDomHitTesting: false });
  const point = (seriesId: string, dataIndex: number, x: number, y = 30) => ({
    seriesId,
    dataIndex,
    x,
    y,
    data: { x, y },
  });
  engine.updateData([
    point("a", 0, 60),
    point("a", 1, 90),
    point("b", 0, 60, 40),
    point("b", 1, 90, 40),
  ]);
  for (const seriesId of ["lazy-a", "lazy-b"]) {
    engine
      .registerGeometry()
      .updatePrepared(
        { length: 1, seriesId, get: () => point(seriesId, 0, 100) },
        buildGrid(new Float64Array([100, 30])),
        { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
      );
  }
  const access = createInteractionAccess(store);
  const context = {
    getChartContext: () => ({ chartStore: store, engine }),
    ...access,
  } as SensorContext;
  const sensor = KeyboardSensor();
  const press = (key = "ArrowRight") =>
    sensor(
      {
        signal: {
          action: InputAction.KEY,
          source: InputSource.KEYBOARD,
          key,
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
      } as EngineEvent,
      context,
    );
  const identities = () =>
    access
      .getInteraction("primary-hover")
      ?.targets.map(({ seriesId, dataIndex }) => [seriesId, dataIndex]);
  press();
  expect(identities()).toEqual([
    ["a", 0],
    ["b", 0],
  ]);
  press();
  expect(identities()).toEqual([
    ["a", 1],
    ["b", 1],
  ]);
  press();
  expect(identities()).toEqual([["lazy-a", 0]]);
  press();
  expect(identities()).toEqual([["lazy-b", 0]]);
  press("ArrowLeft");
  expect(identities()).toEqual([["lazy-a", 0]]);
  press("Escape");
  expect(access.getInteraction("primary-hover")).toBeNull();
  press();
  expect(identities()).toEqual([
    ["a", 0],
    ["b", 0],
  ]);
  engine.dispose();
});

it.each([false, true])(
  "preserves ordinary custom category slices with repeated categories: %s",
  (repeated) => {
    const p = (x: number, y = 10, dataIndex = 0, seriesId = "s") => ({
      x,
      y,
      dataIndex,
      seriesId,
      data: { x: 0, y: 1 },
    });
    const v = { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 };
    const run = (withLazy: boolean) => {
      const store = createChartStore({ width: 600, height: 400 }, "x", "y");
      updateChartState(store, {
        data: repeated
          ? [
              { x: 0, y: 1 },
              { x: 0, y: 2 },
            ]
          : [{ x: 0, y: 1 }],
        dimensions: store.getState().dimensions,
      });
      registerSeries(store, "a", [{ id: "a", type: "custom", x: "x", y: "y" }]);
      registerSeries(store, "b", [{ id: "b", type: "custom", x: "x", y: "y" }]);
      const engine = new Engine({ useDomHitTesting: false });
      engine.registerGeometry([
        p(10, 10, 0, "a"),
        ...(repeated ? [p(30, 30, 1, "a")] : []),
      ]);
      engine.registerGeometry([
        p(20, 20, 0, "b"),
        ...(repeated ? [p(40, 40, 1, "b")] : []),
      ]);
      if (withLazy) {
        engine
          .registerGeometry()
          .updatePrepared(
            { length: 1, seriesId: "lazy", get: () => p(200, 200, 0, "lazy") },
            buildGrid(new Float64Array([200, 200])),
            v,
          );
      }
      const access = createInteractionAccess(store);
      KeyboardSensor()(
        {
          signal: {
            action: InputAction.KEY,
            source: InputSource.KEYBOARD,
            key: "ArrowRight",
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
        } as EngineEvent,
        {
          getChartContext: () => ({ chartStore: store, engine }),
          ...access,
        } as SensorContext,
      );
      const result = access
        .getInteraction("primary-hover")
        ?.targets.map((p) => [p.seriesId, p.dataIndex]);
      engine.dispose();
      return result;
    };
    expect(run(false)).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
    expect(run(true)).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
  },
);
