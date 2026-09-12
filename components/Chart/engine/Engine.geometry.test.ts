import { expect, it, vi } from "vitest";

import { Engine } from "./Engine";

it("refreshes resolved targets on owner updates without reading root points", () => {
  const engine = new Engine<{ value: number }>({ useDomHitTesting: false });
  let reads = 0;
  engine.updateData([
    {
      get x() {
        reads++;
        return 10;
      },
      y: 10,
      data: { value: 1 },
      seriesId: "root",
      dataIndex: 0,
    },
  ]);
  const owner = engine.registerGeometry([
    { x: 20, y: 20, data: { value: 2 }, seriesId: "custom", dataIndex: 0 },
  ]);
  const changes = vi.fn(() =>
    engine.resolveTarget({ seriesId: "custom", dataIndex: 0 }),
  );
  const stop = engine.subscribeGeometryChanges(changes);
  reads = 0;
  owner.update([
    { x: 30, y: 40, data: { value: 3 }, seriesId: "custom", dataIndex: 0 },
  ]);
  expect(reads).toBe(0);
  expect(changes.mock.results[0].value).toMatchObject({
    data: { value: 3 },
    coordinate: { x: 30, y: 40 },
  });
  owner.dispose();
  expect(changes.mock.results[1].value).toBeNull();
  owner.dispose();
  owner.update([]);
  expect(changes).toHaveBeenCalledTimes(2);
  stop();
  engine.registerGeometry([]);
  expect(changes).toHaveBeenCalledTimes(2);
});

it("resolves a standalone owner and invalidates it on disposal without registered series", () => {
  const engine = new Engine<number>({ useDomHitTesting: false });
  const owner = engine.registerGeometry([
    { x: 30, y: 50, data: 3, seriesId: "standalone", dataIndex: 0 },
  ]);
  const target = { seriesId: "standalone", dataIndex: 0 };
  expect(engine.resolveTarget(target)).toMatchObject({
    data: 3,
    coordinate: { x: 30, y: 50 },
  });
  const changes = vi.fn(() => engine.resolveTarget(target));
  engine.subscribeGeometryChanges(changes);
  owner.dispose();
  expect(changes.mock.results[0].value).toBeNull();
});

it("keeps normal root projection separate from an explicit owner override", () => {
  const engine = new Engine<number>({ useDomHitTesting: false });
  const target = { seriesId: "root", dataIndex: 0 };
  engine.updateData([{ x: 10, y: 20, data: 1, ...target }]);
  expect(engine.resolveTarget(target)).toBeUndefined();
  const owner = engine.registerGeometry([{ x: 70, y: 90, data: 7, ...target }]);
  expect(engine.resolveTarget(target)).toMatchObject({
    data: 7,
    coordinate: { x: 70, y: 90 },
  });
  const ownedTarget = engine.resolveTarget(target)!;
  const changes = vi.fn(() => engine.resolveTarget(ownedTarget));
  engine.subscribeGeometryChanges(changes);
  owner.update([{ x: 80, y: 95, data: 8, ...target }]);
  expect(changes.mock.results[0].value).toMatchObject({
    data: 8,
    coordinate: { x: 80, y: 95 },
  });
  owner.dispose();
  expect(changes.mock.results[1].value).toBeNull();
  expect(engine.resolveTarget(target)).toBeUndefined();
});
