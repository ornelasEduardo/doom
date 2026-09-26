import { expect, it } from "vitest";

import { buildGrid, PreparedGrid } from "./PreparedGrid";
import { SpatialMap } from "./SpatialMap";

const points = () =>
  Array.from({ length: 100 }, (_, dataIndex) => ({
    dataIndex,
    seriesId: "s",
    data: dataIndex,
    x: (dataIndex % 10) / 10,
    y: Math.floor(dataIndex / 10) / 10,
  }));
it("finds exact regions and moves existing slots without rebuilding buffers", () => {
  const rows = points(),
    coords = Float64Array.from(rows.flatMap((p) => [p.x, p.y]));
  const buffers = buildGrid(coords, 8),
    grid = new PreparedGrid(rows, buffers);
  const found: number[] = [];
  grid.query(0, 0, 0.11, 0.11, (p) => found.push(p.dataIndex));
  expect(found.sort((a, b) => a - b)).toEqual([0, 1, 10, 11]);
  grid.patch([{ ...rows[0], x: 2, y: 2 }]);
  const moved: number[] = [];
  grid.query(1, 1, 3, 3, (p) => moved.push(p.dataIndex));
  expect(moved).toEqual([0]);
  expect(grid.get("s", 0)?.x).toBe(2);
  expect(buffers.coordinates[0]).toBe(2);
});
it("adopts a prepared owner and preserves viewport, slice, and patch behavior", () => {
  const rows = points(),
    map = new SpatialMap<number>({
      useDomHitTesting: false,
      magneticRadius: 1,
    });
  const owner = map.registerGeometry();
  owner.updatePrepared(
    rows,
    buildGrid(Float64Array.from(rows.flatMap((p) => [p.x, p.y]))),
    { scaleX: 100, scaleY: 100, translateX: 30, translateY: 40 },
  );
  expect(map.find(40, 50)[0]?.dataIndex).toBe(11);
  expect(map.findAllAtX(40)).toHaveLength(10);
  owner.patch([{ ...rows[11], y: 0.15 }]);
  expect(map.resolveTarget("s", 11)?.coordinate).toEqual({ x: 40, y: 55 });
  expect(map.find(40, 50)).toEqual([]);
  owner.dispose();
  expect(map.find(40, 55)).toEqual([]);
});
it("matches exact region scans after repeated moves across cell boundaries", () => {
  const rows = points();
  const grid = new PreparedGrid(
    rows.slice(),
    buildGrid(Float64Array.from(rows.flatMap((p) => [p.x, p.y])), 8),
  );
  for (let step = 0; step < 50; step++) {
    const index = (step * 17) % rows.length;
    rows[index] = {
      ...rows[index],
      x: Math.sin(step) * 2,
      y: Math.cos(step) * 2,
    };
    grid.patch([rows[index]]);
    const x = Math.sin(step * 3),
      y = Math.cos(step * 3);
    const actual: number[] = [];
    grid.query(x, y, x + 0.6, y + 0.6, (p) => actual.push(p.dataIndex));
    const expected = rows
      .filter((p) => p.x >= x && p.x <= x + 0.6 && p.y >= y && p.y <= y + 0.6)
      .map((p) => p.dataIndex);
    expect(actual.sort((a, b) => a - b)).toEqual(expected);
  }
});

it("uses explicit bounds while retaining finite-coordinate validation and edge queries", () => {
  const coordinates = new Float64Array([-5, 2, 5, 8, 20, 20]);
  const bounds = { minX: -10, minY: 0, width: 20, height: 10 };
  const buffers = buildGrid(coordinates, 8, bounds);
  expect(buffers).toMatchObject(bounds);
  const rows = Array.from({ length: 3 }, (_, i) => ({
    x: coordinates[i * 2],
    y: coordinates[i * 2 + 1],
    seriesId: "s",
    dataIndex: i,
    data: i,
  }));
  const grid = new PreparedGrid(rows, buffers);
  const found: number[] = [];
  grid.query(19, 19, 21, 21, (p) => found.push(p.dataIndex));
  expect(found).toEqual([2]);
  expect(() => buildGrid(new Float64Array([NaN, 0]), 8, bounds)).toThrow(
    RangeError,
  );
  expect(() => buildGrid(coordinates, 8, { ...bounds, width: 0 })).toThrow(
    RangeError,
  );
});
