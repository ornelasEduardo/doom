import { describe, expect, it } from "vitest";

import { SpatialMap } from "./SpatialMap";

const point = (seriesId: string, x: number) => ({
  x,
  y: 10,
  data: { seriesId },
  seriesId,
  dataIndex: 0,
});

describe("owner-scoped geometry", () => {
  it("updates and disposes each owner without replacing root or other owners", () => {
    const map = new SpatialMap({ useDomHitTesting: false });
    map.updateIndex([point("root", 10)]);
    const first = map.registerGeometry([point("annotation", 20)]);
    const second = map.registerGeometry([point("handle", 30)]);
    map.updateIndex([point("root", 15)]);
    first.update([point("annotation", 25)]);
    expect(
      map
        .find(25, 10)
        .map((p) => p.seriesId)
        .sort(),
    ).toEqual(["annotation", "handle", "root"]);
    first.dispose();
    first.update([point("ghost", 25)]);
    first.dispose();
    expect(
      map
        .find(25, 10)
        .map((p) => p.seriesId)
        .sort(),
    ).toEqual(["handle", "root"]);
    second.dispose();
    expect(map.find(15, 10).map((p) => p.seriesId)).toEqual(["root"]);
  });
  it("clear invalidates old owner handles", () => {
    const map = new SpatialMap({ useDomHitTesting: false });
    const owner = map.registerGeometry([point("custom", 10)]);
    map.clear();
    owner.update([point("ghost", 10)]);
    expect(map.find(10, 10)).toEqual([]);
  });
});

it("does not read root coordinates when an owner moves repeatedly", () => {
  let reads = 0;
  const root = {
    ...point("root", 10),
    get x() {
      reads++;
      return 10;
    },
  };
  const map = new SpatialMap({ useDomHitTesting: false });
  map.updateIndex([root]);
  const owner = map.registerGeometry([point("custom", 20)]);
  reads = 0;
  for (let i = 0; i < 20; i++) {
    owner.update([point("custom", i)]);
  }
  expect(reads).toBe(0);
});

it("lets the last registered owner override identity until disposal, regardless of update order", () => {
  const map = new SpatialMap({ useDomHitTesting: false });
  map.updateIndex([point("same", 5)]);
  const first = map.registerGeometry([point("same", 10)]);
  const last = map.registerGeometry([point("same", 20)]);
  first.update([point("same", 15)]);
  map.updateIndex([point("same", 7)]);
  expect(map.find(20, 10).map((p) => p.coordinate.x)).toEqual([20]);
  expect(map.findAllAtX(7)).toEqual([]);
  last.dispose();
  expect(map.find(20, 10).map((p) => p.coordinate.x)).toEqual([15]);
  first.dispose();
  expect(map.find(20, 10).map((p) => p.coordinate.x)).toEqual([7]);
});
