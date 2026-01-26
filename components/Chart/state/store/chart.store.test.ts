import { describe, expect, it } from "vitest";

import { ChartConfig } from "../../types";
import {
  createChartStore,
  registerSeries,
  unregisterSeries,
  updateChartData,
  updateChartDimensions,
} from "./chart.store";

describe("ChartStore", () => {
  const mockConfig: ChartConfig = {
    width: 500,
    height: 300,
    type: "line",
  };

  const xAccessor = "date";
  const yAccessor = "value";

  it("should initialize with slice defaults", () => {
    const store = createChartStore(mockConfig, xAccessor, yAccessor);
    const state = store.getState();

    expect(state.status).toBe("idle");
    expect(state.data).toEqual([]);
    expect(state.series).toBeInstanceOf(Map);
    expect(state.interactions).toBeInstanceOf(Map);
    expect(state.dimensions.width).toBe(500);
    expect(state.scales.x).toBeNull();
  });

  it("should update dimensions and transition status", () => {
    const store = createChartStore(mockConfig, xAccessor, yAccessor);

    updateChartDimensions(store, 800, 600);
    const state = store.getState();

    expect(state.dimensions.width).toBe(800);
    expect(state.dimensions.height).toBe(600);
    expect(state.status).toBe("ready");
  });

  it("should calculate scales when data is updated", () => {
    const store = createChartStore(mockConfig, xAccessor, yAccessor);
    updateChartDimensions(store, 500, 300);

    const testData = [
      { date: 1, value: 10 },
      { date: 2, value: 20 },
    ];

    updateChartData(store, testData);
    const state = store.getState();

    expect(state.data).toEqual(testData);
    expect(state.scales.x).not.toBeNull();
    expect(state.scales.y).not.toBeNull();
  });

  it("should manage series registration", () => {
    const store = createChartStore(mockConfig, xAccessor, yAccessor);
    const seriesId = "test-series";
    const seriesConfigs = [{ label: "Test", color: "red" }];

    registerSeries(store, seriesId, seriesConfigs);
    let state = store.getState();

    expect(state.series.has(seriesId)).toBe(true);
    expect(state.processedSeries.length).toBe(1);
    expect(state.processedSeries[0].label).toBe("Test");

    unregisterSeries(store, seriesId);
    state = store.getState();
    expect(state.series.has(seriesId)).toBe(false);
    expect(state.processedSeries.length).toBe(0);
  });
});
