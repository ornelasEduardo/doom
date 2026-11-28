import { expect, it } from "vitest";

import { createDensity } from "./density";

it("conserves counts across detail levels and refines with the viewport", () => {
  const coordinates = new Float64Array([0, 0, 0.01, 0.01, 0.8, 0.8, 1, 1]);
  const density = createDensity(coordinates, 16);
  const wide = density.view({ x: 0, y: 0, width: 1, height: 1 }, 2);
  expect(wide.counts.reduce((a, b) => a + b, 0)).toBe(4);
  expect(wide.positions.length).toBe(4);
  const close = density.view({ x: 0, y: 0, width: 0.25, height: 0.25 }, 4);
  expect(close.cells).toBeGreaterThan(wide.cells);
  expect(close.counts.reduce((a, b) => a + b, 0)).toBe(2);
});
it("moves only changed points through every level and handles domain boundaries", () => {
  const coordinates = new Float64Array([0, 0, 1, 1]);
  const density = createDensity(coordinates, 16);
  density.patch(0, 1, 1);
  const view = density.view({ x: 0, y: 0, width: 1, height: 1 }, 16);
  expect(Array.from(view.counts)).toEqual([2]);
  expect(view.positions[0]).toBeCloseTo(31 / 32);
});

it("excludes out-of-domain points and tracks moves across the boundary", () => {
  const density = createDensity(new Float64Array([-1, 0.5, 0.5, 0.5]), 16);
  const full = { x: 0, y: 0, width: 1, height: 1 };
  expect(Array.from(density.view(full, 16).counts)).toEqual([1]);
  density.patch(0, 0.5, 0.5);
  expect(Array.from(density.view(full, 16).counts)).toEqual([2]);
  density.patch(1, 2, 2);
  expect(Array.from(density.view(full, 16).counts)).toEqual([1]);
});

it("reuses density buffers within the same cell window and invalidates them on edits", () => {
  const density = createDensity(new Float64Array([0.5, 0.5]), 16);
  const full = { x: 0, y: 0, width: 1, height: 1 };
  const frame = density.view(full, 16);
  expect(
    density.view({ x: 0.001, y: 0.001, width: 0.998, height: 0.998 }, 15),
  ).toBe(frame);
  density.patch(0, 0.9, 0.9);
  expect(density.view(full, 16)).not.toBe(frame);
});

it.each([
  { x: NaN, y: 0, width: 1, height: 1 },
  { x: 0, y: Infinity, width: 1, height: 1 },
  { x: 0, y: 0, width: Infinity, height: 1 },
])("rejects non-finite viewports", (viewport) => {
  const density = createDensity(new Float64Array([0.5, 0.5]), 16);
  expect(() => density.view(viewport, 16)).toThrow(RangeError);
});
