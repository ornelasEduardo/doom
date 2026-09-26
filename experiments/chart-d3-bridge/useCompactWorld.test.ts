import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { prepareCompact } from "./compact-world";
import { useCompactWorld } from "./useCompactWorld";

class WorkerDouble {
  static instances: WorkerDouble[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() {
    WorkerDouble.instances.push(this);
  }
  send(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}
function setup() {
  WorkerDouble.instances = [];
  vi.stubGlobal("Worker", WorkerDouble);
  return renderHook(({ revision }) => useCompactWorld(100000, revision), {
    initialProps: { revision: 0 },
  });
}
afterEach(() => vi.unstubAllGlobals());

it("reports worker construction failures instead of throwing from the effect", () => {
  vi.stubGlobal(
    "Worker",
    class {
      constructor() {
        throw new Error("blocked");
      }
    },
  );
  const { result } = renderHook(() => useCompactWorld(100000, 0));
  expect(result.current.error).toContain("blocked");
  expect(result.current.loading).toBe(false);
});
it("reports post failures and releases the worker", () => {
  vi.stubGlobal(
    "Worker",
    class extends WorkerDouble {
      postMessage = vi.fn(() => {
        throw new Error("clone failed");
      });
    },
  );
  const { result } = renderHook(() => useCompactWorld(100000, 0));
  expect(result.current.error).toContain("clone failed");
  expect(WorkerDouble.instances.at(-1)!.terminate).toHaveBeenCalledTimes(1);
});
it("rejects ready-before-draw and stops loading", () => {
  const { result } = setup();
  act(() => WorkerDouble.instances[0].send({ stage: "ready" }));
  expect(result.current.error).toBeTruthy();
  expect(result.current.loading).toBe(false);
  expect(WorkerDouble.instances[0].terminate).toHaveBeenCalledTimes(1);
});
it("handles unreadable messages and ignores callbacks after failure or cancellation", () => {
  const { result, rerender, unmount } = setup();
  const first = WorkerDouble.instances[0];
  const stale = first.onmessage!;
  act(() => first.onmessageerror?.());
  expect(result.current.error).toBeTruthy();
  rerender({ revision: 1 });
  act(() => stale({ data: { stage: "draw" } } as MessageEvent));
  expect(result.current.error).toBeUndefined();
  expect(result.current.world.length).toBe(0);
  unmount();
  expect(first.terminate).toHaveBeenCalledTimes(1);
  expect(WorkerDouble.instances[1].terminate).toHaveBeenCalledTimes(1);
});
it("rejects mismatched draw buffers without publishing a partial world", () => {
  const { result } = setup();
  const data = prepareCompact(1);
  act(() =>
    WorkerDouble.instances[0].send({
      stage: "draw",
      encoding: "projected",
      ...data,
    }),
  );
  expect(result.current.error).toBeTruthy();
  expect(result.current.world.length).toBe(0);
});

it.each(["raw", "projected"] as const)(
  "completes %s preparation and ignores late responses",
  (encoding) => {
    WorkerDouble.instances = [];
    vi.stubGlobal("Worker", WorkerDouble);
    const { result, unmount } = renderHook(() =>
      useCompactWorld(100000, 0, encoding),
    );
    const worker = WorkerDouble.instances[0];
    const receive = worker.onmessage!;
    const buffers = prepareCompact(100000, 0, encoding);
    act(() =>
      worker.send({
        stage: "draw",
        encoding,
        positions: buffers.positions,
        values: encoding === "projected" ? buffers.values : undefined,
        preparationMs: 1,
      }),
    );
    const world = result.current.world;
    expect(world.length).toBe(100000);
    expect(world.ready).toBe(false);
    expect(result.current.loading).toBe(true);
    act(() =>
      worker.send({
        stage: "ready",
        grid: buffers.grid,
        values: encoding === "raw" ? buffers.values : undefined,
        indexMs: 2,
      }),
    );
    expect(result.current.world).toBe(world);
    expect(world.ready).toBe(true);
    expect(result.current.loading).toBe(false);
    act(() => receive({ data: { stage: "draw" } } as MessageEvent));
    expect(result.current.error).toBeUndefined();
    unmount();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  },
);
it("retains the last drawing during replacement and ignores a cancelled worker", () => {
  const { result, rerender, unmount } = setup();
  const buffers = prepareCompact(100000);
  const first = WorkerDouble.instances[0];
  const receive = first.onmessage!;
  act(() =>
    first.send({
      stage: "draw",
      encoding: "projected",
      values: buffers.values,
      positions: buffers.positions,
      preparationMs: 1,
    }),
  );
  const previous = result.current.world;
  rerender({ revision: 1 });
  act(() =>
    receive({
      data: { stage: "ready", grid: buffers.grid, indexMs: 2 },
    } as MessageEvent),
  );
  expect(result.current.world).toBe(previous);
  expect(previous.ready).toBe(false);
  expect(result.current.loading).toBe(true);
  expect(result.current.error).toBeUndefined();
  unmount();
  expect(first.terminate).toHaveBeenCalledTimes(1);
});
