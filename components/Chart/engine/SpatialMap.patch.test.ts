import { expect, it, vi } from "vitest";

import { Engine } from "./Engine";
import { SpatialMap } from "./SpatialMap";

const point = (dataIndex: number, x = dataIndex, y = 10) => ({
  dataIndex,
  x,
  y,
  data: { value: y },
  seriesId: "s",
});
it("patches identities, spatial hits and slices without rebuilding untouched geometry", () => {
  const map = new SpatialMap({ useDomHitTesting: false, magneticRadius: 1 });
  const untouched = {
    ...point(1),
    get x() {
      return 1;
    },
  };
  const owner = map.registerGeometry([point(0), untouched]);
  const reads = vi.spyOn(untouched, "x", "get");
  const rebuild = vi.spyOn(SpatialMap.prototype, "updateIndex");
  owner.patch([point(0, 2, 30)]);
  expect(rebuild).not.toHaveBeenCalled();
  expect(reads.mock.calls.length).toBeLessThanOrEqual(4);
  expect(map.find(0, 10)).toHaveLength(1);
  expect(map.find(2, 30)[0]?.data).toEqual({ value: 30 });
  expect(map.findAllAtX(0)).toEqual([]);
  expect(map.findAllAtX(2)[0]?.dataIndex).toBe(0);
  rebuild.mockRestore();
  reads.mockRestore();
});
it("publishes a batch once and rejects unknown identities before making changes", () => {
  const engine = new Engine({ useDomHitTesting: false });
  const owner = engine.registerGeometry([point(0), point(1)]);
  const notify = vi.fn();
  engine.subscribeGeometryChanges(notify);
  expect(() => owner.patch([point(0, 0, 20), point(99)])).toThrow();
  expect(
    engine.resolveTarget({ seriesId: "s", dataIndex: 0 })?.coordinate.y,
  ).toBe(10);
  expect(notify).not.toHaveBeenCalled();
  owner.patch([point(0, 0, 20), point(1, 1, 40)]);
  expect(notify).toHaveBeenCalledTimes(1);
  expect(
    engine.resolveTarget({ seriesId: "s", dataIndex: 1 })?.coordinate.y,
  ).toBe(40);
  owner.dispose();
  owner.patch([point(0)]);
  engine.dispose();
});
