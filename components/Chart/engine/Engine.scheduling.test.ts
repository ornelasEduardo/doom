import { afterEach, expect, it, vi } from "vitest";

import { Engine } from "./Engine";
import { SpatialMap } from "./SpatialMap";
import { EngineEvent, InputAction, InputSignal, InputSource } from "./types";

const engines: Engine[] = [];
function fixture() {
  const engine = new Engine({ useDomHitTesting: false });
  engines.push(engine);
  const seen: EngineEvent[] = [];
  engine.setHandler((e) => seen.push(e));
  return { engine, seen };
}
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
const frame = () => new Promise(requestAnimationFrame);
afterEach(() => {
  engines.splice(0).forEach((e) => e.dispose());
  vi.restoreAllMocks();
});

it("resolves queued moves against the current geometry at dispatch", async () => {
  const { engine, seen } = fixture();
  engine.updateData([
    { x: 50, y: 50, seriesId: "a", dataIndex: 0, data: "old" },
  ]);
  engine.input(signal());
  engine.updateData([
    { x: 50, y: 50, seriesId: "a", dataIndex: 0, data: "new" },
  ]);
  await frame();
  expect(seen[0].primaryCandidate?.data).toBe("new");
});
it("critical keys acknowledge synchronously without spatial lookup", () => {
  const { engine } = fixture();
  const query = vi.spyOn(SpatialMap.prototype, "find");
  engine.setHandler((e) => {
    if (e.signal.key === "ArrowRight") {
      e.handled = true;
    }
  });
  expect(
    engine.input(
      signal({
        action: InputAction.KEY,
        source: InputSource.KEYBOARD,
        key: "ArrowRight",
      }),
    ),
  ).toBe(true);
  expect(
    engine.input(
      signal({
        action: InputAction.KEY,
        source: InputSource.KEYBOARD,
        key: "q",
      }),
    ),
  ).toBe(false);
  expect(query).not.toHaveBeenCalled();
});
it("registered geometry participates in input, updates and unregisters independently", () => {
  const { engine, seen } = fixture();
  const base = { x: 50, y: 50, seriesId: "base", dataIndex: 0, data: "base" };
  engine.updateData([base]);
  const registration = engine.registerGeometry([
    { ...base, x: 150, seriesId: "extension", data: "extension" },
  ]);
  engine.input(signal({ action: InputAction.START, x: 150 }));
  expect(seen.at(-1)?.primaryCandidate?.data).toBe("extension");
  registration.update([
    { ...base, x: 200, seriesId: "extension", data: "updated" },
  ]);
  engine.input(signal({ action: InputAction.START, x: 200 }));
  expect(seen.at(-1)?.primaryCandidate?.data).toBe("updated");
  registration.dispose();
  engine.input(signal({ action: InputAction.START, x: 200 }));
  expect(seen.at(-1)?.candidates).toEqual([]);
  engine.input(signal({ action: InputAction.START }));
  expect(seen.at(-1)?.primaryCandidate?.data).toBe("base");
});
it("resolves the slice of a policy-selected candidate rather than the primary hit", () => {
  const { engine, seen } = fixture();
  engine.updateData([
    { x: 50, y: 50, seriesId: "actual", dataIndex: 0, data: "nearest" },
    { x: 60, y: 50, seriesId: "actual", dataIndex: 1, data: "chosen" },
    {
      x: 60,
      y: 150,
      seriesId: "forecast",
      dataIndex: 1,
      data: "matching forecast",
    },
  ]);
  engine.input(signal({ action: InputAction.START }));
  expect(seen[0].primaryCandidate?.data).toBe("nearest");
  const chosen = seen[0].candidates.find(
    (candidate) => candidate.data === "chosen",
  )!;
  expect(
    engine.resolveSlice(chosen).map((candidate) => candidate.data),
  ).toEqual(["chosen", "matching forecast"]);
});
