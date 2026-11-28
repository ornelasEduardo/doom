import { expect, it } from "vitest";

import { buildGrid } from "../../components/Chart/engine/PreparedGrid";
import { createCompactData, nearestCompact } from "./compact";

it("creates deterministic coordinates with exact indexed point lookup", () => {
  const data = createCompactData(1000);
  expect(data.coordinates).toHaveLength(2000);
  expect(data.coordinates).toEqual(createCompactData(1000).coordinates);
  for (const index of [0, 123, 999]) {
    expect(
      nearestCompact(
        data,
        data.coordinates[index * 2],
        data.coordinates[index * 2 + 1],
        0,
      ),
    ).toBe(index);
  }
  expect(nearestCompact(data, -1, -1, 0.01)).toBeUndefined();
});

it("rejects invalid hit regions instead of returning arbitrary points", () => {
  const grid = createCompactData(1);
  const [x, y] = grid.coordinates;
  for (const radius of [-1, Infinity, NaN]) {
    expect(nearestCompact(grid, x, y, radius)).toBeUndefined();
  }
  expect(nearestCompact(grid, Infinity, y, 1)).toBeUndefined();
});

it("measures hover distance in display pixels on nonsquare canvases", () => {
  const grid = buildGrid(new Float64Array([0.51, 0.5, 0.5, 0.52]));
  // Horizontal point is ten pixels away; vertical point is only two.
  expect(nearestCompact(grid, 0.5, 0.5, 6, 1000, 100)).toBe(1);
  expect(nearestCompact(grid, 0.5, 0.5, 1, 1000, 100)).toBeUndefined();
  expect(nearestCompact(grid, 0.5, 0.5, 6, 0, 100)).toBeUndefined();
});

it("breaks equal-distance ties by the lowest point index", () => {
  const grid = buildGrid(new Float64Array([0.5, 0.5, 0.5, 0.5]), 1);
  expect(nearestCompact(grid, 0.5, 0.5, 0)).toBe(0);
});

it.each([0, -1, 1.5, NaN, Infinity, 1000001])(
  "rejects invalid count %s",
  (count) => {
    expect(() => createCompactData(count)).toThrow(RangeError);
  },
);
