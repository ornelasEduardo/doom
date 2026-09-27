import { expect, it, vi } from "vitest";

import { buildGrid } from "./PreparedGrid";
import { SpatialMap } from "./SpatialMap";

const v = { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 };
const p = (x: number, y = 10, dataIndex = 0, seriesId = "s") => ({
  x,
  y,
  dataIndex,
  seriesId,
  data: dataIndex,
});
it.each(["array", "numeric"])(
  "matches the exact prepared %s slice before adjacent coordinates",
  (kind) => {
    const rows = [p(100 - 1e-13), p(100, 20, 1)];
    const ordinary = new SpatialMap({ useDomHitTesting: false });
    ordinary.updateIndex(rows);
    expect(ordinary.findAllAtX(100).map((p) => p.dataIndex)).toEqual([1]);
    const prepared = new SpatialMap({ useDomHitTesting: false });
    prepared
      .registerGeometry()
      .updatePrepared(
        kind === "array"
          ? rows
          : { length: rows.length, seriesId: "s", get: (i: number) => rows[i] },
        buildGrid(Float64Array.from(rows.flatMap((p) => [p.x, p.y]))),
        v,
      );
    expect(prepared.findAllAtX(100).map((p) => p.dataIndex)).toEqual([1]);
  },
);
it("query near shadowed root points does not hydrate distant replacement lazy source", () => {
  const n = 20;
  const map = new SpatialMap({ useDomHitTesting: false, magneticRadius: 1 });
  map.updateIndex(Array.from({ length: n }, (_, i) => p(10, 10, i)));
  const get = vi.fn((i: number) => p(1000 + i, 1000, i));
  map
    .registerGeometry()
    .updatePrepared(
      { length: n, seriesId: "s", get },
      buildGrid(
        Float64Array.from(
          Array.from({ length: n }, (_, i) => [1000 + i, 1000]).flat(),
        ),
      ),
      v,
    );
  expect(map.find(10, 10)).toEqual([]);
  expect(get).not.toHaveBeenCalled();
});
