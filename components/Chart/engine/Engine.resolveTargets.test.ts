import { expect, it, vi } from "vitest";

import { Engine } from "./Engine";

it("preserves ordered tri-state results, owner precedence and disposal without DOM reads", () => {
  const engine = new Engine<number>();
  const container = document.createElement("div");
  engine.setContainer(container);
  const queries = vi.spyOn(container, "querySelectorAll");
  const root = { seriesId: "root", dataIndex: 0 };
  const owned = { seriesId: "owned", dataIndex: 0 };
  engine.updateData([{ ...root, x: 10, y: 20, data: 1 }]);
  engine.registerGeometry([{ ...owned, x: 30, y: 40, data: 2 }]);
  const original = engine.resolveTarget(owned)!;
  const later = engine.registerGeometry([{ ...owned, x: 50, y: 60, data: 3 }]);
  const latest = engine.resolveTarget(owned)!;
  expect(
    engine.resolveTargets([root, owned, original, {}, latest] as const),
  ).toEqual([undefined, latest, original, null, latest]);
  later.dispose();
  expect(engine.resolveTargets([latest, owned, root])).toEqual([
    null,
    original,
    undefined,
  ]);
  expect(queries).not.toHaveBeenCalled();
});

it("scans DOM once, preserves first exact identity matches and sees edits in the next batch", () => {
  const engine = new Engine<number>();
  const container = document.createElement("div");
  engine.setContainer(container);
  const mark = (series: string, index: string, data?: number) => {
    const node = document.createElement("span");
    node.setAttribute("data-chart-type", "data-point");
    node.setAttribute("data-chart-series", series);
    node.setAttribute("data-chart-index", index);
    if (data !== undefined) {
      Object.assign(node, { __data__: data });
    }
    container.append(node);
    return node;
  };
  mark("custom", "00", 9); // Must not alias dataIndex 0.
  const first = mark("custom", "0", 1);
  const duplicate = mark("custom", "0", 2);
  mark("empty", "0");
  mark("empty", "0", 3); // A later duplicate must not replace an empty first hit.
  const custom = { seriesId: "custom", dataIndex: 0 };
  const empty = { seriesId: "empty", dataIndex: 0 };
  const missing = { seriesId: "missing", dataIndex: 0 };
  const queries = vi.spyOn(container, "querySelectorAll");
  const results = engine.resolveTargets([missing, custom, empty, custom]);
  expect(results.map((target) => target?.data ?? null)).toEqual([
    null,
    1,
    null,
    1,
  ]);
  expect(queries).toHaveBeenCalledTimes(1);
  queries.mockClear();
  first.remove();
  Object.assign(duplicate, { __data__: 4 });
  expect(
    engine
      .resolveTargets([custom, missing])
      .map((target) => target?.data ?? null),
  ).toEqual([4, null]);
  expect(queries).toHaveBeenCalledTimes(1);
  expect(engine.resolveTarget(custom)?.data).toBe(4);
});
