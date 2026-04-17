import { describe, expect, it, vi } from "vitest";

import { Config } from "../../types";
import {
  createChartStore,
  registerSeries,
  unregisterSeries,
  updateChartData,
  updateChartDimensions,
  updateChartState,
} from "./chart.store";
import { selectChartOrientation } from "./slices/series.slice";

describe("ChartStore", () => {
  const mockConfig: Config = {
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

  describe("selectChartOrientation", () => {
    it("defaults to vertical when no series declares an orientation", () => {
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      registerSeries(store, "a", [{ label: "A", color: "red" }]);

      expect(selectChartOrientation(store.getState())).toBe("vertical");
    });

    it("returns the declared orientation when one series sets it", () => {
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      registerSeries(store, "a", [
        { label: "A", color: "red", orientation: "horizontal" },
      ]);

      expect(selectChartOrientation(store.getState())).toBe("horizontal");
    });

    it("returns the first declared orientation when multiple agree", () => {
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      registerSeries(store, "a", [
        { label: "A", color: "red", orientation: "horizontal" },
      ]);
      registerSeries(store, "b", [
        { label: "B", color: "blue", orientation: "horizontal" },
      ]);

      expect(selectChartOrientation(store.getState())).toBe("horizontal");
    });

    it("warns and returns the first declared orientation when mixed", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      registerSeries(store, "a", [
        { label: "A", color: "red", orientation: "horizontal" },
      ]);
      registerSeries(store, "b", [
        { label: "B", color: "blue", orientation: "vertical" },
      ]);

      expect(selectChartOrientation(store.getState())).toBe("horizontal");
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0][0]).toContain("Mixed series orientations");
      warnSpy.mockRestore();
    });

    it("ignores series without a declared orientation", () => {
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      registerSeries(store, "a", [{ label: "A", color: "red" }]);
      registerSeries(store, "b", [
        { label: "B", color: "blue", orientation: "horizontal" },
      ]);

      expect(selectChartOrientation(store.getState())).toBe("horizontal");
    });

    it("returns vertical when no series are registered at all", () => {
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      expect(selectChartOrientation(store.getState())).toBe("vertical");
    });

    it("falls back to vertical after unregistering the only horizontal series", () => {
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      registerSeries(store, "a", [
        { label: "A", color: "red", orientation: "horizontal" },
      ]);
      expect(selectChartOrientation(store.getState())).toBe("horizontal");

      unregisterSeries(store, "a");
      expect(selectChartOrientation(store.getState())).toBe("vertical");
    });

    it("preserves orientation through data updates (re-hydration)", () => {
      const store = createChartStore(mockConfig, xAccessor, yAccessor);
      updateChartDimensions(store, 500, 300);
      registerSeries(store, "a", [
        { label: "A", color: "red", orientation: "horizontal" },
      ]);
      expect(selectChartOrientation(store.getState())).toBe("horizontal");

      // updateChartState re-hydrates series from stored configs; orientation
      // should survive the round-trip.
      updateChartState(store, {
        data: [{ date: 1, value: 10 }],
        dimensions: store.getState().dimensions,
      });

      expect(selectChartOrientation(store.getState())).toBe("horizontal");
    });
  });
});
