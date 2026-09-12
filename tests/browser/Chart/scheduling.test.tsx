import { afterEach, expect, it, vi } from "vitest";

import { Engine } from "../../../components/Chart/engine/Engine";
import { SpatialMap } from "../../../components/Chart/engine/SpatialMap";
import {
  EngineEvent,
  InputAction,
  InputSignal,
  InputSource,
} from "../../../components/Chart/engine/types";

const engines: Engine[] = [];
const containers: HTMLElement[] = [];
const frame = () => new Promise(requestAnimationFrame);
function signal(overrides: Partial<InputSignal> = {}): InputSignal {
  return {
    id: 1,
    userId: "local",
    source: InputSource.MOUSE,
    action: InputAction.MOVE,
    x: 50,
    y: 50,
    timestamp: 1,
    ...overrides,
  };
}
function fixture() {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:0;top:0;width:300px;height:200px";
  document.body.append(container);
  containers.push(container);
  const engine = new Engine();
  engines.push(engine);
  engine.setContainer(container);
  engine.updateData([
    { x: 50, y: 50, seriesId: "data", dataIndex: 0, data: "target" },
  ]);
  const seen: EngineEvent[] = [];
  engine.setHandler((e) => seen.push(e));
  return { engine, seen, container };
}
afterEach(() => {
  for (const engine of engines.splice(0)) {
    engine.dispose();
  }
  vi.restoreAllMocks();
  containers.splice(0).forEach((e) => e.remove());
});

it("public producers query once per stream per frame across a 10000-input burst", async () => {
  const { engine, seen } = fixture();
  const query = vi.spyOn(SpatialMap.prototype, "find");
  for (let i = 0; i < 10000; i++) {
    engine.input(
      signal({ x: 50 + (i % 2), userId: i % 2 ? "remote" : "local" }),
    );
  }
  expect(query).toHaveBeenCalledTimes(0);
  await frame();
  expect(query).toHaveBeenCalledTimes(2);
  expect(
    seen.map((e) => [e.signal.userId, e.signal.x, e.primaryCandidate?.data]),
  ).toEqual([
    ["local", 50, "target"],
    ["remote", 51, "target"],
  ]);
});
it("public producers deliver the final MOVE before synchronous END", async () => {
  const { engine, seen } = fixture();
  engine.input(signal({ action: InputAction.START }));
  engine.input(signal({ x: 51 }));
  engine.input(signal({ x: 52 }));
  engine.input(signal({ action: InputAction.END, x: 53 }));
  expect(seen.map((e) => [e.signal.action, e.chartX])).toEqual([
    ["START", 50],
    ["MOVE", 52],
    ["END", 53],
  ]);
  await frame();
  expect(seen).toHaveLength(3);
});
it("explicit chart dismissal cancels queued inputs across streams", async () => {
  const { engine, seen } = fixture();
  engine.input(signal());
  engine.input(signal({ userId: "remote" }));
  engine.input(
    signal({ id: 99, action: InputAction.CANCEL, cancelScope: "chart" }),
  );
  await frame();
  expect(seen.map((e) => e.signal.action)).toEqual(["CANCEL"]);
});
it("engines remain isolated and accept fresh input after disposal and activation", async () => {
  const a = fixture();
  const b = fixture();
  a.engine.input(signal());
  b.engine.input(signal());
  a.engine.dispose();
  await frame();
  expect(a.seen).toHaveLength(0);
  expect(b.seen).toHaveLength(1);
  a.engine.activate();
  a.engine.input(signal({ x: 51 }));
  await frame();
  expect(a.seen.map((e) => e.signal.x)).toEqual([51]);
});
it("Engine forwards plot geometry so DOM candidates use plot coordinates", () => {
  const { engine, seen, container } = fixture();
  const plot = document.createElement("div");
  plot.style.cssText =
    "position:absolute;left:20px;top:30px;width:200px;height:150px";
  const mark = document.createElement("div");
  mark.style.cssText =
    "position:absolute;left:40px;top:40px;width:20px;height:20px";
  mark.setAttribute("data-chart-type", "bar");
  Object.assign(mark, { __data__: { value: 42 } });
  plot.append(mark);
  container.append(plot);
  engine.updateData([]);
  engine.setContainer(container, plot, {
    x: 20,
    y: 30,
    width: 200,
    height: 150,
  });
  engine.input(signal({ action: InputAction.START, x: 70, y: 80 }));
  expect(seen[0].primaryCandidate?.coordinate).toEqual({ x: 50, y: 50 });
});

it.each([undefined, "stream"] as const)(
  "CANCEL scope %s preserves other users and pointer sources",
  async (cancelScope) => {
    const { engine, seen } = fixture();
    engine.input(signal());
    engine.input(signal({ userId: "remote" }));
    engine.input(signal({ source: InputSource.TOUCH }));
    engine.input(signal({ id: 2 }));
    engine.input(signal({ action: InputAction.CANCEL, cancelScope }));
    await frame();
    expect(
      seen.map((e) => [
        e.signal.action,
        e.signal.userId,
        e.signal.source,
        e.signal.id,
      ]),
    ).toEqual([
      ["CANCEL", "local", "mouse", 1],
      ["MOVE", "remote", "mouse", 1],
      ["MOVE", "local", "touch", 1],
      ["MOVE", "local", "mouse", 2],
    ]);
  },
);
