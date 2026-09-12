import { expect, it, vi } from "vitest";

import { Engine } from "./Engine";
import { InputAction, type InputSignal, InputSource } from "./types";

const signal: InputSignal = {
  action: InputAction.CANCEL,
  id: 7,
  userId: "remote-user",
  source: InputSource.REMOTE,
  x: 0,
  y: 0,
  timestamp: 0,
};
it("notifies exact stream cancellation, chart cancellation and disposal", () => {
  const engine = new Engine();
  const observe = vi.fn();
  const unsubscribe = engine.subscribeCancellation(observe);
  engine.input(signal);
  engine.input({ ...signal, cancelScope: "chart" });
  engine.dispose();
  expect(observe.mock.calls).toEqual([
    [
      {
        scope: "stream",
        id: 7,
        userId: "remote-user",
        source: InputSource.REMOTE,
      },
    ],
    [{ scope: "chart" }],
    [{ scope: "chart" }],
  ]);
  unsubscribe();
  engine.activate();
  engine.input(signal);
  expect(observe).toHaveBeenCalledTimes(3);
});
it("snapshots cancellation subscribers and isolates failures", () => {
  const engine = new Engine();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const last = vi.fn();
  let unsubscribe = () => {};
  engine.subscribeCancellation(() => {
    unsubscribe();
    throw new Error("subscriber");
  });
  unsubscribe = engine.subscribeCancellation(last);
  try {
    engine.input(signal);
    expect(last).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalled();
    engine.input(signal);
    expect(last).toHaveBeenCalledOnce();
  } finally {
    error.mockRestore();
  }
});

it.each(["stream", "chart"] as const)(
  "%s cancellation rejects reentrant input until dispatch finishes, then accepts fresh gestures",
  (cancelScope) => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const seen: string[] = [];
    const engine = new Engine({
      onEvent: ({ signal: current }) => {
        seen.push(`${current.id}:${current.action}`);
        if (current.action === InputAction.CANCEL) {
          engine.input({ ...signal, action: InputAction.START });
          engine.input({ ...signal, action: InputAction.MOVE });
        }
      },
    });
    let calls = 0;
    engine.subscribeCancellation(() => {
      calls++;
      if (calls > 1) {
        return;
      }
      engine.input({ ...signal, action: InputAction.END });
      engine.input({ ...signal, cancelScope });
      engine.input({ ...signal, id: 8, action: InputAction.START });
    });
    try {
      engine.input({ ...signal, action: InputAction.MOVE });
      engine.input({ ...signal, cancelScope });
      frames.splice(0).forEach((callback) => callback(16));
      expect(seen).toEqual(
        cancelScope === "chart" ? ["7:CANCEL"] : ["8:START", "7:CANCEL"],
      );
      expect(calls).toBe(1);
      engine.input({ ...signal, action: InputAction.START });
      engine.input({ ...signal, action: InputAction.MOVE });
      engine.input({ ...signal, action: InputAction.END });
      expect(seen.slice(-3)).toEqual(["7:START", "7:MOVE", "7:END"]);
    } finally {
      engine.dispose();
      vi.unstubAllGlobals();
    }
  },
);

it("does not dispatch cancellation after a subscriber disposes the engine", () => {
  const dispatch = vi.fn();
  const engine = new Engine({ onEvent: dispatch });
  engine.subscribeCancellation(() => engine.dispose());
  engine.input(signal);
  expect(dispatch).not.toHaveBeenCalled();
  engine.activate();
  engine.input({ ...signal, action: InputAction.START });
  expect(dispatch).toHaveBeenCalledOnce();
});
