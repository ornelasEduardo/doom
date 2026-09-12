import { expect, it, vi } from "vitest";

import {
  Engine,
  type EngineEvent,
  InputAction,
  InputSource,
} from "../../engine";
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
