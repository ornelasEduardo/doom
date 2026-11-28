import { expect, it, vi } from "vitest";

import { Engine } from "./Engine";
import { SpatialMap } from "./SpatialMap";

const point = (seriesId: string, x: number, y: number) => ({
  seriesId,
  x,
  y,
  dataIndex: 0,
  data: seriesId,
});
const viewport = {
  scaleX: 100,
  scaleY: 200,
  translateX: 30,
  translateY: 40,
  clip: { x: 30, y: 40, width: 100, height: 200 },
};

it("moves queries and resolved targets without rebuilding or reading indexed points", () => {
  const map = new SpatialMap({ useDomHitTesting: false, magneticRadius: 10 });
  const p = {
    ...point("s", 0.25, 0.5),
    get x() {
      return 0.25;
    },
  };
  const owner = map.registerGeometry([p]);
  const reads = vi.spyOn(p, "x", "get");
  owner.setViewport(viewport);
  expect(reads).not.toHaveBeenCalled();
  const hit = map.find(55, 140)[0];
  expect(hit.coordinate).toEqual({ x: 55, y: 140 });
  expect(map.find(66, 140)).toHaveLength(0);
  expect(map.resolveTarget("s", 0, hit.geometryOwner)?.coordinate).toEqual(
    hit.coordinate,
  );
  owner.setViewport({ ...viewport, translateX: 50 });
  expect(map.resolveTarget("s", 0, hit.geometryOwner)?.coordinate.x).toBe(75);
  owner.dispose();
  expect(map.resolveTarget("s", 0, hit.geometryOwner)).toBeNull();
});

it("clips targets and matches screen-space slices across differently transformed owners", () => {
  const map = new SpatialMap({ useDomHitTesting: false });
  const first = map.registerGeometry([point("a", 0.25, 0.5)]);
  const second = map.registerGeometry([point("b", 0.5, 0.25)]);
  first.setViewport(viewport);
  second.setViewport({ ...viewport, scaleX: 50 });
  const hit = map.resolveTarget("a", 0)!;
  expect(
    map
      .findSlice(hit)
      .map((p) => p.seriesId)
      .sort(),
  ).toEqual(["a", "b"]);
  second.setViewport({ ...viewport, scaleX: 50, translateY: 300 });
  expect(map.resolveTarget("b", 0)).toBeNull();
  expect(map.findSlice(hit).map((p) => p.seriesId)).toEqual(["a"]);
});

it("publishes viewport invalidation and rejects invalid transforms atomically", () => {
  const engine = new Engine({ useDomHitTesting: false });
  const owner = engine.registerGeometry([point("s", 0.25, 0.5)]);
  const notify = vi.fn();
  engine.subscribeGeometryChanges(notify);
  owner.setViewport(viewport);
  expect(notify).toHaveBeenCalledTimes(1);
  const revision = engine.getGeometryRevision();
  expect(() => owner.setViewport({ ...viewport, scaleX: 0 })).toThrow();
  expect(engine.getGeometryRevision()).toBe(revision);
  expect(
    engine.resolveTarget({ seriesId: "s", dataIndex: 0 })?.coordinate,
  ).toEqual({ x: 55, y: 140 });
  engine.dispose();
});

it("publishes replacement data and its viewport as one consistent geometry change", () => {
  const engine = new Engine<string>({ useDomHitTesting: false });
  const owner = engine.registerGeometry([point("s", 0.25, 0.5)]);
  const snapshots: unknown[] = [];
  engine.subscribeGeometryChanges(() =>
    snapshots.push(
      engine.resolveTarget({ seriesId: "s", dataIndex: 0 })?.coordinate,
    ),
  );
  owner.update([point("s", 0.5, 0.25)], viewport);
  expect(snapshots).toEqual([{ x: 80, y: 90 }]);
  owner.update([point("s", 50, 60)], null);
  expect(snapshots[1]).toEqual({ x: 50, y: 60 });
  engine.dispose();
});
