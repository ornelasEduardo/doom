import { expect, it, vi } from "vitest";

import { adoptDrawing, prepareCompact } from "./compact-world";

it("exposes drawing buffers before indexing and publishes readiness on the same owner", () => {
  const full = prepareCompact(8);
  const world = adoptDrawing({
    values: full.values,
    positions: full.positions,
  });
  const changed = vi.fn();
  world.subscribe(changed);
  expect(world.ready).toBe(false);
  expect(world.buffers().positions).toBe(full.positions);
  expect(world.get(0).latency).toBe(80);
  expect(() => world.patch([{ index: 0, x: 2, y: 3 }])).toThrow();
  world.attachGrid({ grid: full.grid });
  expect(world.ready).toBe(true);
  expect(world.buffers().grid).toBe(full.grid);
  expect(changed).toHaveBeenCalledOnce();
  expect(world.patch([{ index: 0, x: 2, y: 3 }])).toEqual([0]);
});

it("replaces temporary raw precision with exact values when the index arrives", () => {
  const full = prepareCompact(1000, 0, "raw");
  const world = adoptDrawing({
    values: full.positions,
    positions: full.positions,
    encoding: "raw",
  });
  expect(world.buffers().values).toBe(full.positions);
  world.attachGrid({ grid: full.grid, values: full.values });
  expect(world.buffers().values).toBe(full.values);
  expect(world.get(999).requests).toBe(full.values[1998]);
  expect(world.buffers().positions).toBe(full.positions);
});
