import { expect, it, vi } from "vitest";

import {
  adoptCompact,
  prepareCompact,
} from "../../../experiments/chart-d3-bridge/compact-world";
import { createCustomGeometry } from "../utils/customGeometry";
import { Engine } from "./Engine";
import { buildGrid } from "./PreparedGrid";
import { SpatialMap } from "./SpatialMap";
import type { InteractionCandidate } from "./types";

const v = { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 };
const p = (x: number, y = 10, seriesId = "s", dataIndex = 0) => ({
  x,
  y,
  seriesId,
  dataIndex,
  data: dataIndex,
});
const lazy = (x: number, seriesId = "s") => ({
  length: 1,
  seriesId,
  get: () => p(x, 10, seriesId),
});
function fixture() {
  const matrix = {
    is2D: true,
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
    inverse() {
      return this;
    },
    multiply() {
      return this;
    },
  };
  const group = {
    ownerSVGElement: { getScreenCTM: () => matrix },
    getScreenCTM: () => matrix,
  } as unknown as SVGGElement;
  const engine = new Engine({ useDomHitTesting: false });
  return { engine, g: createCustomGeometry(engine, group, "s") };
}
it("multiple registrations remain keyboard-reachable", () => {
  const engine = new Engine({ useDomHitTesting: false });
  for (const [s, x] of [
    ["a", 10],
    ["b", 20],
  ] as const) {
    engine
      .registerGeometry()
      .updatePrepared(lazy(x, s), buildGrid(new Float64Array([x, 10])), v);
  }
  let current: InteractionCandidate | null = null;
  const visited = new Set();
  for (const dir of [1, 1, -1, -1, 1] as const) {
    const hit: InteractionCandidate | undefined = engine.navigateCompact(
      current ?? null,
      dir,
    )?.[0];
    visited.add(hit?.seriesId);
    current = hit ?? null;
  }
  expect([...visited].sort()).toEqual(["a", "b"]);
});
it("compact navigation honors newer owner precedence", () => {
  const map = new SpatialMap({ useDomHitTesting: false });
  map
    .registerGeometry()
    .updatePrepared(lazy(10), buildGrid(new Float64Array([10, 10])), v);
  map.registerGeometry([p(20)]);
  expect(map.find(10, 10).map((h) => h.coordinate)).toEqual([{ x: 20, y: 10 }]);
  expect(map.navigateCompact(null, 1)?.[0].coordinate).toEqual({
    x: 20,
    y: 10,
  });
});
it("first numeric updateProjected requires a prepared index", () => {
  const { engine, g } = fixture();
  expect(() => g.updateProjected(lazy(10), v)).toThrow(/updatePrepared/);
  expect(engine.resolveTarget({ seriesId: "s", dataIndex: 0 })).toBeNull();
});
it("replacement numeric updateProjected requires a prepared index", () => {
  const { engine, g } = fixture();
  g.updatePrepared(lazy(10), buildGrid(new Float64Array([10, 10])), v);
  expect(() => g.updateProjected(lazy(20), v)).toThrow(/updatePrepared/);
  expect(
    engine.resolveTarget({ seriesId: "s", dataIndex: 0 })?.coordinate,
  ).toEqual({ x: 10, y: 10 });
});
it("independent-owner patch preserves other chart hit testing", () => {
  const grid = buildGrid(new Float64Array([10, 10])),
    source = lazy(10);
  const a = new SpatialMap({ useDomHitTesting: false, magneticRadius: 1 }),
    b = new SpatialMap({ useDomHitTesting: false, magneticRadius: 1 });
  const owner = a.registerGeometry();
  owner.updatePrepared(source, grid, v);
  b.registerGeometry().updatePrepared(source, grid, v);
  expect(b.find(10, 10)).toHaveLength(1);
  owner.patch([p(100, 100)]);
  expect(b.resolveTarget("s", 0)?.coordinate).toEqual({ x: 10, y: 10 });
  expect(b.find(10, 10)).toHaveLength(1);
});
it("clipped slice does not hydrate hidden records", () => {
  const n = 10000,
    coords = Float64Array.from(
      Array.from({ length: n }, (_, i) => [10, i]).flat(),
    );
  const get = vi.fn((i: number) => p(10, i, "s", i));
  const map = new SpatialMap({ useDomHitTesting: false });
  map
    .registerGeometry()
    .updatePrepared({ length: n, seriesId: "s", get }, buildGrid(coords), {
      ...v,
      clip: { x: 0, y: 0, width: 20, height: 1 },
    });
  expect(map.findAllAtX(10)).toHaveLength(2);
  expect(get.mock.calls.length).toBe(2);
});
it("exact ordinary slice selects exact bucket", () => {
  const map = new SpatialMap({ useDomHitTesting: false });
  map.updateIndex([p(100 - 1e-13), p(100, 20, "s", 1)]);
  expect(map.findAllAtX(100).map((h) => h.dataIndex)).toEqual([1]);
});
it("keeps subscribed charts synchronized after a shared world patch", () => {
  const world = adoptCompact(prepareCompact(2));
  const maps = [
    new SpatialMap({ useDomHitTesting: false, magneticRadius: 1e-6 }),
    new SpatialMap({ useDomHitTesting: false, magneticRadius: 1e-6 }),
  ];
  for (const map of maps) {
    const owner = map.registerGeometry();
    const get = (i: number) => ({ ...world.point(i), seriesId: "s" });
    owner.updatePrepared(
      { length: world.length, seriesId: "s", get },
      world.buffers().grid,
      v,
    );
    // Materialize each registration's cache before the edit.
    expect(map.resolveTarget("s", 0)).not.toBeNull();
    world.subscribe((indices) => owner.patch(indices.map(get)));
  }
  world.patch([{ index: 0, x: 100, y: 100 }]);
  const expected = world.point(0);
  for (const map of maps) {
    expect(map.resolveTarget("s", 0)?.coordinate).toEqual({
      x: expected.x,
      y: expected.y,
    });
    expect(
      map.find(expected.x, expected.y).some((h) => h.dataIndex === 0),
    ).toBe(true);
  }
});

it("traverses root, eager, and million-row lazy owners without hydrating hidden or shadowed rows", () => {
  const map = new SpatialMap({ useDomHitTesting: false });
  map.updateIndex([p(1, 10, "root")]);
  const n = 1_000_000,
    coords = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    coords[i * 2] = i;
    coords[i * 2 + 1] = 10;
  }
  const get = vi.fn((i: number) => p(i, 10, "large", i));
  map
    .registerGeometry()
    .updatePrepared({ length: n, seriesId: "large", get }, buildGrid(coords), {
      ...v,
      clip: { x: n - 2, y: 0, width: 2, height: 20 },
    });
  const override = map.registerGeometry([p(9, 10, "large", n - 2)]);
  const eager = map.registerGeometry();
  eager.updatePrepared(
    [p(7, 10, "eager")],
    buildGrid(new Float64Array([7, 10])),
    v,
  );
  let current = map.navigateCompact(null, 1)![0];
  const visited = [current?.seriesId];
  for (let i = 0; i < 3; i++) {
    current = map.navigateCompact(current, 1)![0];
    visited.push(current?.seriesId);
  }
  expect(visited).toEqual(["root", "large", "large", "eager"]);
  expect(get.mock.calls.map(([i]) => i)).toEqual([n - 1]);
  current = map.navigateCompact(current, -1)![0];
  expect(current?.coordinate.x).toBe(9);
  override.dispose();
  expect(map.navigateCompact(current, 1)?.[0].seriesId).toBe("root");
});

it("external shared buffer edits cannot change an unmaterialized owner until publication", () => {
  const grid = buildGrid(new Float64Array([10, 10]));
  const get = () => p(grid.coordinates[0], grid.coordinates[1]);
  const a = new SpatialMap({ useDomHitTesting: false });
  a.registerGeometry().updatePrepared(
    { length: 1, seriesId: "s", get },
    grid,
    v,
  );
  grid.coordinates[0] = 100;
  expect(a.resolveTarget("s", 0)?.coordinate).toEqual({ x: 10, y: 10 });
});

it("array-backed prepared patches do not replace another owners points", () => {
  const points = [p(10)],
    grid = buildGrid(new Float64Array([10, 10]));
  const a = new SpatialMap({ useDomHitTesting: false }),
    b = new SpatialMap({ useDomHitTesting: false });
  const owner = a.registerGeometry();
  owner.updatePrepared(points, grid, v);
  b.registerGeometry().updatePrepared(points, grid, v);
  owner.patch([p(100)]);
  expect(b.resolveTarget("s", 0)?.coordinate).toEqual({ x: 10, y: 10 });
  expect(points[0].x).toBe(10);
});

it("supplies the owning series for numeric custom geometry without a source seriesId", () => {
  const { engine, g } = fixture();
  const source = {
    length: 1,
    get: (dataIndex: number) => ({ x: 10, y: 10, data: 7, dataIndex }),
  };
  g.updatePrepared(source, buildGrid(new Float64Array([10, 10])), v);
  g.updateProjected(source, { ...v, translateX: 20 });
  expect(engine.resolveTarget({ seriesId: "s", dataIndex: 0 })).toMatchObject({
    seriesId: "s",
    data: 7,
    coordinate: { x: 30, y: 10 },
  });
});

it("visits ordinary multi-series slices once while retaining separate lazy targets", () => {
  const map = new SpatialMap({ useDomHitTesting: false });
  map.updateIndex([
    p(10, 10, "a", 0),
    p(20, 10, "a", 1),
    p(10, 20, "b", 0),
    p(20, 20, "b", 1),
  ]);
  const get = vi.fn((i: number) => p(10, 30, "lazy", i));
  map
    .registerGeometry()
    .updatePrepared(
      { length: 1, seriesId: "lazy", get },
      buildGrid(new Float64Array([10, 30])),
      v,
    );
  const first = map.navigateCompact(null, 1);
  expect(first).toMatchObject([
    { seriesId: "a", dataIndex: 0 },
    { seriesId: "b", dataIndex: 0 },
  ]);
  expect(get).not.toHaveBeenCalled();
  const second = map.navigateCompact(first![0], 1);
  expect(second).toMatchObject([
    { seriesId: "a", dataIndex: 1 },
    { seriesId: "b", dataIndex: 1 },
  ]);
  const third = map.navigateCompact(second![0], 1);
  expect(third).toMatchObject([{ seriesId: "lazy", dataIndex: 0 }]);
  expect(map.navigateCompact(third![0], -1)).toEqual(second);
  expect(get).toHaveBeenCalledTimes(1);
});

it("recovers a cursor after source replacement and disposal with bounded hydration", () => {
  const map = new SpatialMap({ useDomHitTesting: false });
  const make = (seriesId: string, length: number) => ({
    length,
    seriesId,
    get: vi.fn((i: number) => p(i, 10, seriesId, i)),
  });
  const first = make("a", 3),
    replacement = make("replacement", 1),
    other = make("other", 1);
  const owner = map.registerGeometry();
  owner.updatePrepared(
    first,
    buildGrid(new Float64Array([0, 10, 1, 10, 2, 10])),
    v,
  );
  const tail = map.registerGeometry();
  tail.updatePrepared(other, buildGrid(new Float64Array([0, 10])), v);
  let cursor = map.navigateCompact(null, 1)![0];
  cursor = map.navigateCompact(cursor, 1)![0];
  owner.updatePrepared(replacement, buildGrid(new Float64Array([0, 10])), v);
  cursor = map.navigateCompact(cursor, -1)![0];
  expect(cursor).toMatchObject({ seriesId: "replacement", dataIndex: 0 });
  owner.dispose();
  cursor = map.navigateCompact(cursor, 1)![0];
  expect(cursor.seriesId).toBe("other");
  expect(map.navigateCompact(cursor, 1)?.[0]).toEqual(cursor);
  expect(first.get).toHaveBeenCalledTimes(2);
  expect(replacement.get).toHaveBeenCalledTimes(1);
  expect(other.get).toHaveBeenCalledTimes(1);
});
