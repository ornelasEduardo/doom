import { expect, it, vi } from "vitest";

import { buildGrid } from "./PreparedGrid";
import { SpatialMap } from "./SpatialMap";

it("adopts lazy geometry without materializing rows and navigates visible indices", () => {
  const get = vi.fn((dataIndex: number) => ({
    seriesId: "s",
    dataIndex,
    data: { value: dataIndex },
    x: dataIndex / 10,
    y: 0.5,
  }));
  const map = new SpatialMap<{ value: number }>({ useDomHitTesting: false });
  const owner = map.registerGeometry();
  owner.updatePrepared(
    { length: 10, seriesId: "s", get },
    buildGrid(
      Float64Array.from(
        Array.from({ length: 10 }, (_, i) => [i / 10, 0.5]).flat(),
      ),
    ),
    {
      scaleX: 100,
      scaleY: 100,
      translateX: 0,
      translateY: 0,
      clip: { x: 20, y: 0, width: 60, height: 100 },
    },
  );
  expect(get).not.toHaveBeenCalled();
  expect(map.navigateCompact(-1, 1)?.dataIndex).toBe(2);
  expect(get.mock.calls.length).toBeLessThan(3);
  expect(map.resolveTarget("s", 5)?.data?.value).toBe(5);
  owner.dispose();
  expect(map.navigateCompact(-1, 1)).toBeUndefined();
});

it("filters screen-space radius and clipping before materializing lazy records", () => {
  const coordinates = new Float64Array([0.5, 0.5, 0.59, 0.59, 0.4, 0.5]);
  const get = vi.fn((dataIndex: number) => ({
    seriesId: "s",
    dataIndex,
    data: { value: dataIndex },
    x: coordinates[dataIndex * 2],
    y: coordinates[dataIndex * 2 + 1],
  }));
  const map = new SpatialMap<{ value: number }>({
    useDomHitTesting: false,
    magneticRadius: 10,
  });
  const owner = map.registerGeometry();
  owner.updatePrepared(
    { length: 3, seriesId: "s", get },
    buildGrid(coordinates),
    {
      scaleX: 100,
      scaleY: 100,
      translateX: 0,
      translateY: 0,
      clip: { x: 45, y: 0, width: 55, height: 100 },
    },
  );
  const candidates = map.find(50, 50);
  expect(candidates.map((point) => point.dataIndex)).toEqual([0]);
  expect(get.mock.calls.map(([index]) => index)).toEqual([0]);
  owner.dispose();
});
