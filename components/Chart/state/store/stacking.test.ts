import { expect, it } from "vitest";

import {
  createChartStore,
  registerSeries,
  unregisterSeries,
  updateChartData,
  updateChartState,
} from "./chart.store";

it("aligns stack categories with separate positive and negative totals and independent stack ids", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "category",
    "value",
  );
  updateChartData(store, [
    { category: "A", value: 10 },
    { category: "B", value: -8 },
  ]);
  registerSeries(store, "a", [
    { id: "a", type: "bar", x: "category", y: "value", stackId: "s" },
  ]);
  registerSeries(store, "b", [
    {
      id: "b",
      type: "bar",
      x: "category",
      y: "value",
      stackId: "s",
      data: [
        { category: "B", value: -4 },
        { category: "A", value: 20 },
        { category: "C", value: 5 },
      ],
    },
  ]);
  registerSeries(store, "c", [
    {
      id: "c",
      type: "bar",
      x: "category",
      y: "value",
      stackId: "other",
      data: [{ category: "A", value: 7 }],
    },
  ]);
  const state = store.getState();
  expect(state.processedSeries[1].stackRanges).toEqual([
    [-8, -12],
    [10, 30],
    [0, 5],
  ]);
  expect(state.processedSeries[2].stackRanges).toEqual([[0, 7]]);
  expect(state.scales.x!.domain()).toEqual(["A", "B", "C"]);
  expect(state.scales.y!.domain()[0]).toBeLessThanOrEqual(-12);
  expect(state.scales.y!.domain()[1]).toBeGreaterThanOrEqual(30);
  updateChartState(store, {
    data: [
      { category: "A", value: 100 },
      { category: "B", value: -80 },
    ],
    dimensions: state.dimensions,
  });
  expect(store.getState().processedSeries[1].stackRanges).toEqual([
    [-80, -84],
    [100, 120],
    [0, 5],
  ]);
  expect(store.getState().scales.y!.domain()[1]).toBeGreaterThanOrEqual(120);
  const stackedMax = store.getState().scales.y!.domain()[1];
  unregisterSeries(store, "b");
  expect(store.getState().scales.x!.domain()).toEqual(["A", "B"]);
  expect(store.getState().scales.y!.domain()[1]).toBeLessThan(
    Number(stackedMax),
  );
});

it("keeps hover rows in their own datasets during refresh and drops removed series", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "category",
    "value",
  );
  updateChartData(store, [{ category: "A", value: 10 }]);
  registerSeries(store, "a", [
    { id: "a", type: "bar", x: "category", y: "value", stackId: "s" },
  ]);
  const local = [{ category: "A", value: 20 }];
  registerSeries(store, "b", [
    {
      id: "b",
      type: "bar",
      x: "category",
      y: "value",
      stackId: "s",
      data: local,
    },
  ]);
  store.setState({
    interactions: new Map([
      [
        "primary-hover",
        { targets: [{ seriesId: "b", dataIndex: 0, data: local[0] }] },
      ],
    ]),
  });
  updateChartState(store, {
    data: [{ category: "A", value: 100 }],
    dimensions: store.getState().dimensions,
  });
  expect(
    store.getState().interactions.get("primary-hover")?.targets[0].data,
  ).toEqual({ category: "A", value: 20 });
  unregisterSeries(store, "b");
  expect(store.getState().interactions.has("primary-hover")).toBe(false);
});

it("preserves numeric category identity including zero and distinct string keys", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "category",
    "value",
  );
  updateChartData(store, [
    { category: 0, value: 5 },
    { category: 1, value: 10 },
    { category: "1", value: 20 },
  ]);
  registerSeries(store, "a", [
    { id: "a", type: "bar", x: "category", y: "value" },
  ]);
  expect(store.getState().scales.x!.domain()).toEqual([0, 1, "1"]);
});

it("expands mixed line/bar scales without dropping root categories or line values", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "line" },
    "category",
    "value",
  );
  updateChartData(store, [
    { category: "A", value: 100 },
    { category: "B", value: 200 },
  ]);
  registerSeries(store, "bar", [
    {
      id: "bar",
      type: "bar",
      x: "category",
      y: "value",
      data: [{ category: "A", value: 10 }],
    },
  ]);
  expect(store.getState().scales.x!.domain()).toEqual(["A", "B"]);
  expect(store.getState().scales.y!.domain()[1]).toBeGreaterThanOrEqual(240);
});

it("hydrates omitted bar orientations from the first explicit declaration", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "value",
    "category",
  );
  updateChartData(store, [{ category: "A", value: 10 }]);
  registerSeries(store, "first", [
    {
      id: "first",
      type: "bar",
      x: "value",
      y: "category",
      orientation: "horizontal",
      stackId: "s",
    },
  ]);
  registerSeries(store, "second", [
    { id: "second", type: "bar", x: "value", y: "category", stackId: "s" },
  ]);
  expect(store.getState().processedSeries).toHaveLength(2);
  expect(store.getState().processedSeries[1].orientation).toBe("horizontal");
  expect(store.getState().processedSeries[1].stackRanges).toEqual([[10, 20]]);
});

it("expands a mixed continuous x domain for local bar categories", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "line" },
    "x",
    "y",
  );
  updateChartData(store, [
    { x: 0, y: 100 },
    { x: 10, y: 200 },
  ]);
  registerSeries(store, "bar", [
    { id: "bar", type: "bar", x: "x", y: "y", data: [{ x: 20, y: 10 }] },
  ]);
  expect(store.getState().scales.x!.domain()).toEqual([0, 20]);
});

it("preserves a registered line domain even when the root type is bar", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "category",
    "value",
  );
  updateChartData(store, [
    { category: "A", value: 100 },
    { category: "B", value: 200 },
  ]);
  registerSeries(store, "line", [
    { id: "line", type: "line", x: "category", y: "value" },
  ]);
  registerSeries(store, "bar", [
    {
      id: "bar",
      type: "bar",
      x: "category",
      y: "value",
      data: [{ category: "A", value: 10 }],
    },
  ]);
  expect(store.getState().scales.x!.domain()).toEqual(["A", "B"]);
  expect(store.getState().scales.y!.domain()[1]).toBeGreaterThanOrEqual(240);
});

it("warns when re-registering an earlier series excludes an existing later series", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "category",
    "value",
  );
  registerSeries(store, "a", [
    {
      id: "a",
      type: "bar",
      x: "category",
      y: "value",
      orientation: "vertical",
    },
  ]);
  registerSeries(store, "b", [
    {
      id: "b",
      type: "bar",
      x: "category",
      y: "value",
      orientation: "vertical",
    },
  ]);
  const warnings: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    registerSeries(store, "a", [
      {
        id: "a",
        type: "bar",
        x: "value",
        y: "category",
        orientation: "horizontal",
      },
    ]);
    expect(warnings.flat().join(" ")).toContain("orientation");
    expect(store.getState().processedSeries.map((s) => s.id)).toEqual(["a"]);
  } finally {
    console.warn = original;
  }
});

it("calculates finite signed domains for large multi-series stacks without argument overflow", () => {
  const store = createChartStore(
    { width: 600, height: 400, type: "bar" },
    "category",
    "value",
  );
  const data = Array.from({ length: 100_000 }, (_, index) => ({
    category: index,
    value: index % 2 ? -1 : 1,
  }));
  updateChartData(store, data);
  expect(() => {
    registerSeries(store, "first", [
      { id: "first", type: "bar", x: "category", y: "value", stackId: "s" },
    ]);
    registerSeries(store, "second", [
      {
        id: "second",
        type: "bar",
        x: "category",
        y: (row: (typeof data)[number]) => row.value * 2,
        stackId: "s",
      },
    ]);
  }).not.toThrow();
  const domain = store.getState().scales.y!.domain().map(Number);
  expect(domain.every(Number.isFinite)).toBe(true);
  expect(domain[0]).toBeLessThanOrEqual(-3);
  expect(domain[1]).toBeGreaterThanOrEqual(3);
});
