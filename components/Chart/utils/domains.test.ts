import { expect, it } from "vitest";

import {
  createChartStore,
  registerSeries,
  updateChartData,
  updateChartState,
} from "../state/store/chart.store";
import { createScales } from "./scales";

const dimensions = { top: 0, right: 0, bottom: 0, left: 0 };
for (const values of [
  [-20, 10, 35],
  [-30, -10],
  [0, 0],
  [-5, -5],
  [5, 5],
  [],
]) {
  it(`keeps automatic Y domain finite, ascending, and containing ${JSON.stringify(values)}`, () => {
    const { yScale } = createScales(
      values,
      400,
      300,
      dimensions,
      (v) => v,
      (v) => v,
    );
    const [min, max] = yScale.domain();
    expect(Number.isFinite(min) && Number.isFinite(max)).toBe(true);
    expect(min).toBeLessThan(max);
    for (const value of values) {
      expect(yScale(value)).toBeGreaterThanOrEqual(0);
      expect(yScale(value)).toBeLessThanOrEqual(300);
    }
  });
}
function setup(
  xDomain?: readonly [number | null, number | null],
  yDomain?: readonly [number | null, number | null],
) {
  const store = createChartStore({ width: 400, height: 300 }, "x", "y");
  updateChartState(store, {
    data: [
      { x: 0, y: -20 },
      { x: 10, y: 35 },
    ],
    dimensions: store.getState().dimensions,
    xDomain,
    yDomain,
  });
  return store;
}
it("preserves exact numeric overrides through data and dimension updates", () => {
  const store = setup([-2, 12], [-50, 101]);
  expect(store.getState().scales.x!.domain()).toEqual([-2, 12]);
  expect(store.getState().scales.y!.domain()).toEqual([-50, 101]);
  updateChartData(store, [{ x: 100, y: 200 }]);
  expect(store.getState().scales.y!.domain()).toEqual([-50, 101]);
});
it("supports automatic ends even when the fixed end excludes all data", () => {
  const store = setup([20, null], [null, -100]);
  const x = store.getState().scales.x!.domain() as number[];
  const y = store.getState().scales.y!.domain() as number[];
  expect(x[0]).toBe(20);
  expect(x[1]).toBeGreaterThan(20);
  expect(y[1]).toBe(-100);
  expect(y[0]).toBeLessThan(-100);
});
for (const bounds of [
  [NaN, 10],
  [0, Infinity],
  [20, -20],
  [5, 5],
] as const) {
  it(`falls back to automatic for invalid bounds ${bounds}`, () => {
    expect(setup(undefined, bounds).getState().scales.y!.domain()).toEqual(
      setup().getState().scales.y!.domain(),
    );
  });
}
it("applies overrides after stack totals and leaves category domains intact", () => {
  const store = createChartStore(
    { width: 400, height: 300, type: "bar" },
    "value",
    "category",
  );
  updateChartState(store, {
    data: [{ category: "A", value: 10 }],
    dimensions: store.getState().dimensions,
    xDomain: [-5, 15],
    yDomain: [0, 100],
  });
  registerSeries(store, "a", [
    {
      type: "bar",
      orientation: "horizontal",
      x: "value",
      y: "category",
      stackId: "s",
    },
  ]);
  expect(store.getState().scales.x!.domain()).toEqual([-5, 15]);
  expect(store.getState().scales.y!.domain()).toEqual(["A"]);
});
it("removes overrides on a prop update", () => {
  const store = setup(undefined, [-50, 100]);
  updateChartState(store, {
    data: [{ x: 0, y: 10 }],
    dimensions: store.getState().dimensions,
    yDomain: undefined,
  });
  expect(store.getState().scales.y!.domain()[0]).toBe(0);
});
