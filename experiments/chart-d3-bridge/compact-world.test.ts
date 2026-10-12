import { expect, it } from "vitest";

import { adoptCompact, prepareCompact } from "./compact-world";
import { generateServices } from "./data";

it("keeps the full dataset in numeric buffers and materializes exact rows on demand", () => {
  const buffers = prepareCompact(1000, 1),
    world = adoptCompact(buffers);
  expect(world.summary).toHaveLength(1);
  expect(world.buffers().positions).toBe(buffers.positions);
  expect(world.buffers().grid).toBe(buffers.grid);
  const expected = generateServices(1000, 1);
  for (const index of [0, 7, 8, 999]) {
    expect(world.get(index)).toEqual(expected[index]);
  }
});
it("updates shared numeric storage and publishes only changed indices", () => {
  const world = adoptCompact(prepareCompact(1000));
  const updates: number[][] = [];
  world.subscribe((indices) => updates.push(indices));
  expect(world.editSample(1)).toBe(1);
  expect(world.get(0).latency).toBe(92);
  expect(world.buffers().grid.coordinates[1]).toBe(1 - Math.log10(92) / 3);
  expect(updates).toEqual([[0]]);
  world.editSample(1);
  expect(world.get(0).latency).toBe(80);
});

it("accepts arbitrary sparse patches and keeps the spatial index consistent", () => {
  const world = adoptCompact(prepareCompact(1000));
  expect(world.patch([{ index: 0, x: 999, y: 1 }])).toEqual([0]);
  expect(world.get(0)).toMatchObject({ requests: 999, latency: 1 });
  expect(world.buffers().grid.coordinates[0]).toBe(Math.log10(999) / 3);
  expect(world.patch([{ index: 0, x: 999, y: 1 }])).toEqual([]);
});

it("keeps exact CPU targets while raw GPU buffers and sparse edits use data coordinates", () => {
  const world = adoptCompact(prepareCompact(8, 0, "raw"));
  expect(Array.from(world.buffers().positions.slice(0, 2))).toEqual([40, 80]);
  expect(world.point(0).y).toBe(1 - Math.log10(80) / 3);
  world.patch([{ index: 0, x: 40, y: 92 }]);
  expect(world.buffers().positions[1]).toBe(92);
  expect(world.point(0).y).toBe(1 - Math.log10(92) / 3);
});

it("rejects malformed drawing buffers before exposing a world", () => {
  const buffers = prepareCompact(2);
  expect(() =>
    adoptCompact({ ...buffers, positions: new Float32Array(2) }),
  ).toThrow(RangeError);
  expect(() =>
    adoptCompact({
      ...buffers,
      grid: { ...buffers.grid, next: new Int32Array(0) },
    }),
  ).toThrow(RangeError);
});
it("keeps summaries current after edits", () => {
  const world = adoptCompact(prepareCompact(1));
  world.patch([{ index: 0, x: 50, y: 100 }]);
  expect(world.summary[0]).toEqual(world.get(0));
});

it.each([NaN, Infinity, -1, 1.5])(
  "rejects invalid preparation counts: %s",
  (count) => {
    expect(() => prepareCompact(count)).toThrow(RangeError);
  },
);
it("leaves drawing data and timings untouched when grid adoption fails", async () => {
  const { adoptDrawing } = await import("./compact-world");
  const buffers = prepareCompact(2, 0, "raw");
  const timings = { preparationMs: 1 };
  const world = adoptDrawing({
    values: buffers.positions,
    positions: buffers.positions,
    encoding: "raw",
    timings,
  });
  const replacements = new Float64Array([100, 200, 300, 400]);
  expect(() =>
    world.attachGrid({
      grid: { ...buffers.grid, next: new Int32Array(0) },
      values: replacements,
      indexMs: 10,
    }),
  ).toThrow(RangeError);
  expect(world.ready).toBe(false);
  expect(world.get(0).requests).toBe(40);
  expect(world.timings().indexMs).toBeUndefined();
  world.attachGrid({ grid: buffers.grid, values: buffers.values, indexMs: 2 });
  expect(world.ready).toBe(true);
  expect(timings).toEqual({ preparationMs: 1 });
});
it("rejects non-finite drawing values even before an index arrives", async () => {
  const { adoptDrawing } = await import("./compact-world");
  expect(() =>
    adoptDrawing({
      values: new Float64Array([NaN, 1]),
      positions: new Float32Array(2),
    }),
  ).toThrow(RangeError);
});

it("keeps summary identity stable until its data changes", () => {
  const world = adoptCompact(prepareCompact(2));
  const summary = world.summary;
  expect(world.summary).toBe(summary);
  world.patch([{ index: 1, x: 5, y: 6 }]);
  expect(world.summary).toBe(summary);
  world.patch([{ index: 0, x: 50, y: 100 }]);
  expect(world.summary).not.toBe(summary);
  expect(world.summary[0]).toEqual({
    label: "Auth",
    requests: 50,
    latency: 100,
  });
});

it("rejects invalid entries when raw values and positions share one buffer", async () => {
  const { adoptDrawing } = await import("./compact-world");
  for (const invalid of [NaN, Infinity, -Infinity, 0, -1]) {
    const positions = new Float32Array([1, invalid]);
    expect(() =>
      adoptDrawing({ values: positions, positions, encoding: "raw" }),
    ).toThrow(RangeError);
  }
});
