import { describe, expect, it } from "vitest";

import { clipRectToPlot, isPointInPlot } from "./plotBounds";

const bounds = { innerWidth: 100, innerHeight: 80 };

describe("plot bounds", () => {
  it("includes point centers on plot edges and excludes outside or nonfinite centers", () => {
    expect(isPointInPlot({ x: 0, y: 80 }, bounds)).toBe(true);
    expect(isPointInPlot({ x: 100, y: 0 }, bounds)).toBe(true);
    for (const point of [
      { x: -1, y: 40 },
      { x: 101, y: 40 },
      { x: 50, y: -1 },
      { x: 50, y: 81 },
      { x: NaN, y: 40 },
      { x: 50, y: Infinity },
    ]) {
      expect(isPointInPlot(point, bounds)).toBe(false);
    }
  });

  it("intersects rectangles at each plot edge", () => {
    expect(
      clipRectToPlot({ x: -20, y: -10, width: 150, height: 110 }, bounds),
    ).toEqual({ x: 0, y: 0, width: 100, height: 80 });
    expect(
      clipRectToPlot({ x: 90, y: 70, width: 20, height: 30 }, bounds),
    ).toEqual({ x: 90, y: 70, width: 10, height: 10 });
  });

  it("omits fully outside bars and bars that merely touch an outer edge", () => {
    for (const rect of [
      { x: -20, y: 10, width: 20, height: 10 },
      { x: 100, y: 10, width: 20, height: 10 },
      { x: 20, y: -20, width: 10, height: 20 },
      { x: 20, y: 80, width: 10, height: 20 },
    ]) {
      expect(clipRectToPlot(rect, bounds)).toBeNull();
    }
  });

  it("retains zero-value bars inside the plot", () => {
    expect(
      clipRectToPlot({ x: 20, y: 80, width: 10, height: 0 }, bounds),
    ).toEqual({ x: 20, y: 80, width: 10, height: 0 });
  });

  it("rejects invalid geometry and unavailable plot bounds", () => {
    expect(
      clipRectToPlot({ x: NaN, y: 10, width: 10, height: 10 }, bounds),
    ).toBeNull();
    expect(
      clipRectToPlot({ x: 10, y: 10, width: -1, height: 10 }, bounds),
    ).toBeNull();
    expect(
      clipRectToPlot(
        { x: 10, y: 10, width: 10, height: 10 },
        { innerWidth: NaN, innerHeight: 80 },
      ),
    ).toBeNull();
    expect(
      isPointInPlot(
        { x: 10, y: 10 },
        { innerWidth: Infinity, innerHeight: 80 },
      ),
    ).toBe(false);
  });
});
