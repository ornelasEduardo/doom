import { expect, it } from "vitest";

import { type IndexedPoint, SpatialMap } from "./SpatialMap";

it("uses indexed identity and category buckets without scanning unrelated points on hover", () => {
  let reads = 0;
  const points: IndexedPoint<number>[] = Array.from(
    { length: 1000 },
    (_, i) => ({
      get x() {
        reads++;
        return i;
      },
      y: i,
      data: i,
      seriesId: "line",
      dataIndex: i,
    }),
  );
  points.push({
    x: 300,
    y: 20,
    data: 1001,
    seriesId: "bars",
    dataIndex: 0,
    sliceAxis: "y",
    draggable: true,
    suppressMarker: true,
  });
  points.push({
    x: 500,
    y: 20,
    data: 1002,
    seriesId: "bars2",
    dataIndex: 0,
    sliceAxis: "y",
  });
  const map = new SpatialMap<number>({ useDomHitTesting: false });
  map.updateIndex(points);
  reads = 0;
  const line = map.findSlice({
    type: "data-point",
    seriesId: "line",
    dataIndex: 50,
    data: 50,
    coordinate: { x: 999, y: 999 },
    distance: 0,
  });
  expect(line.map((p) => p.data)).toEqual([50]);
  expect(reads).toBeLessThan(10);
  const bars = map.findSlice({
    type: "bar",
    seriesId: "bars",
    dataIndex: 0,
    data: 1001,
    coordinate: { x: 999, y: 999 },
    distance: 0,
  });
  expect(bars.map((p) => p.data)).toEqual([1001, 1002]);
  expect(bars[0]).toMatchObject({ draggable: true, suppressMarker: true });
  map.updateIndex([]);
  expect(map.findSlice(line[0])).toEqual([]);
});
