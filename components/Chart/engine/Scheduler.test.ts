import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { Scheduler } from "./Scheduler";
import {
  EngineEvent,
  InputAction,
  InputSignal,
  InputSource,
  TaskPriority,
} from "./types";

function event(overrides: Partial<InputSignal> = {}): EngineEvent {
  return {
    signal: {
      id: 1,
      userId: "local",
      source: InputSource.MOUSE,
      action: InputAction.MOVE,
      x: 0,
      y: 0,
      timestamp: 1,
      ...overrides,
    },
    candidates: [],
    sliceCandidates: [],
    chartX: 0,
    chartY: 0,
    isWithinPlot: true,
  };
}
let scheduler: Scheduler;
let frames: Map<number, FrameRequestCallback>;
function frame() {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) {
    callback(16);
  }
}
beforeEach(() => {
  frames = new Map();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  scheduler = new Scheduler();
});
afterEach(() => {
  scheduler.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps the last arrival even when timestamps tie or go backwards", () => {
  vi.spyOn(performance, "now").mockReturnValue(1);
  const seen: number[] = [];
  scheduler.setHandler((e) => seen.push(e.signal.x));
  for (let x = 0; x < 10000; x++) {
    scheduler.schedule(TaskPriority.VISUAL, event({ x, timestamp: 10000 - x }));
  }
  frame();
  expect(seen).toEqual([9999]);
});
it("isolates user, source and pointer identity", () => {
  const seen: InputSignal[] = [];
  scheduler.setHandler((e) => seen.push(e.signal));
  const streams = [
    event(),
    event({ userId: "remote" }),
    event({ source: InputSource.TOUCH }),
    event({ id: 2 }),
  ];
  for (const e of streams) {
    scheduler.schedule(TaskPriority.VISUAL, e);
  }
  frame();
  expect(seen).toEqual(streams.map((e) => e.signal));
});
it("flushes only the terminal stream's latest move before END", () => {
  const seen: string[] = [];
  scheduler.setHandler((e) =>
    seen.push(`${e.signal.id}:${e.signal.action}:${e.signal.x}`),
  );
  scheduler.schedule(TaskPriority.VISUAL, event({ x: 1 }));
  scheduler.schedule(TaskPriority.VISUAL, event({ x: 2 }));
  scheduler.schedule(TaskPriority.VISUAL, event({ id: 2, x: 3 }));
  scheduler.schedule(TaskPriority.CRITICAL, event({ action: InputAction.END }));
  expect(seen).toEqual(["1:MOVE:2", "1:END:0"]);
  frame();
  expect(seen).toEqual(["1:MOVE:2", "1:END:0", "2:MOVE:3"]);
});
it("CANCEL discards its pending stream without losing other users", () => {
  const seen: string[] = [];
  scheduler.setHandler((e) =>
    seen.push(`${e.signal.userId}:${e.signal.action}`),
  );
  scheduler.schedule(TaskPriority.VISUAL, event());
  scheduler.schedule(TaskPriority.VISUAL, event({ userId: "remote" }));
  scheduler.schedule(
    TaskPriority.CRITICAL,
    event({ action: InputAction.CANCEL }),
  );
  frame();
  expect(seen).toEqual(["local:CANCEL", "remote:MOVE"]);
});
it("schedules reentrant work on the next frame", () => {
  const seen: number[] = [];
  scheduler.setHandler((e) => {
    seen.push(e.signal.x);
    if (e.signal.x === 1) {
      scheduler.schedule(TaskPriority.VISUAL, event({ x: 2 }));
    }
  });
  scheduler.schedule(TaskPriority.VISUAL, event({ x: 1 }));
  frame();
  expect(seen).toEqual([1]);
  frame();
  expect(seen).toEqual([1, 2]);
});
it("delivers other streams and reentrant work after a handler throws", () => {
  const seen: number[] = [];
  scheduler.setHandler((e) => {
    seen.push(e.signal.x);
    if (e.signal.x === 1) {
      scheduler.schedule(TaskPriority.VISUAL, event({ x: 3 }));
      throw new Error("sensor failure");
    }
  });
  scheduler.schedule(TaskPriority.VISUAL, event({ x: 1 }));
  scheduler.schedule(TaskPriority.VISUAL, event({ id: 2, x: 2 }));
  expect(frame).toThrow("sensor failure");
  expect(seen).toEqual([1, 2]);
  frame();
  expect(seen).toEqual([1, 2, 3]);
});
it("cancellation inside dispatch also clears the remaining frame batch", () => {
  const seen: number[] = [];
  scheduler.setHandler((e) => {
    seen.push(e.signal.id);
    scheduler.cancelPending();
  });
  scheduler.schedule(TaskPriority.VISUAL, event());
  scheduler.schedule(TaskPriority.VISUAL, event({ id: 2 }));
  frame();
  expect(seen).toEqual([1]);
});
it("END inside dispatch drains the other stream before its turn", () => {
  const seen: string[] = [];
  scheduler.setHandler((e) => {
    seen.push(`${e.signal.id}:${e.signal.action}`);
    if (e.signal.id === 1) {
      scheduler.schedule(
        TaskPriority.CRITICAL,
        event({ id: 2, action: InputAction.END }),
      );
    }
  });
  scheduler.schedule(TaskPriority.VISUAL, event());
  scheduler.schedule(TaskPriority.VISUAL, event({ id: 2 }));
  frame();
  expect(seen).toEqual(["1:MOVE", "2:MOVE", "2:END"]);
});
it("a throwing terminal MOVE still delivers END and permits future input", () => {
  const seen: InputAction[] = [];
  scheduler.setHandler((e) => {
    seen.push(e.signal.action);
    if (e.signal.action === InputAction.MOVE) {
      throw new Error("move failed");
    }
  });
  scheduler.schedule(TaskPriority.VISUAL, event());
  expect(() =>
    scheduler.schedule(
      TaskPriority.CRITICAL,
      event({ action: InputAction.END }),
    ),
  ).toThrow("move failed");
  expect(seen).toEqual([InputAction.MOVE, InputAction.END]);
  scheduler.setHandler((e) => seen.push(e.signal.action));
  scheduler.schedule(TaskPriority.VISUAL, event());
  frame();
  expect(seen).toEqual([InputAction.MOVE, InputAction.END, InputAction.MOVE]);
});
it("does not replay a reentrant MOVE queued while END flushes its stream", () => {
  const seen: string[] = [];
  scheduler.setHandler((e) => {
    seen.push(`${e.signal.action}:${e.signal.x}`);
    if (e.signal.action === InputAction.MOVE) {
      scheduler.schedule(TaskPriority.VISUAL, event({ x: 2 }));
    }
  });
  scheduler.schedule(TaskPriority.VISUAL, event({ x: 1 }));
  scheduler.schedule(TaskPriority.CRITICAL, event({ action: InputAction.END }));
  frame();
  expect(seen).toEqual(["MOVE:1", "END:0"]);
});
it("idle dispatch continues after one consumer throws", () => {
  let flush: (() => void) | undefined;
  vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
    flush = callback;
    return 1;
  });
  const seen: number[] = [];
  scheduler.setHandler((e) => {
    seen.push(e.signal.id);
    if (e.signal.id === 1) {
      throw new Error("idle failed");
    }
  });
  scheduler.schedule(TaskPriority.IDLE, event());
  scheduler.schedule(TaskPriority.IDLE, event({ id: 2 }));
  expect(() => flush?.()).toThrow("idle failed");
  expect(seen).toEqual([1, 2]);
});
it("dispose inside idle dispatch discards remaining work", () => {
  let flush: (() => void) | undefined;
  vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
    flush = callback;
    return 1;
  });
  const seen: number[] = [];
  scheduler.setHandler((e) => {
    seen.push(e.signal.id);
    scheduler.dispose();
  });
  scheduler.schedule(TaskPriority.IDLE, event());
  scheduler.schedule(TaskPriority.IDLE, event({ id: 2 }));
  flush?.();
  expect(seen).toEqual([1]);
});
it.each(["dispose", "cancel"] as const)(
  "%s during the terminal MOVE prevents END reviving the gesture",
  (operation) => {
    const seen: InputAction[] = [];
    scheduler.setHandler((e) => {
      seen.push(e.signal.action);
      if (e.signal.action === InputAction.MOVE) {
        if (operation === "dispose") {
          scheduler.dispose();
        } else {
          scheduler.schedule(
            TaskPriority.CRITICAL,
            event({ action: InputAction.CANCEL }),
          );
        }
      }
    });
    scheduler.schedule(TaskPriority.VISUAL, event());
    scheduler.schedule(
      TaskPriority.CRITICAL,
      event({ action: InputAction.END }),
    );
    expect(seen).toEqual(
      operation === "dispose"
        ? [InputAction.MOVE]
        : [InputAction.MOVE, InputAction.CANCEL],
    );
  },
);

it.each([false, true])(
  "START discards older motion, including an active batch (%s)",
  (duringFrame) => {
    const seen: string[] = [];
    const start = () =>
      scheduler.schedule(
        TaskPriority.CRITICAL,
        event({ id: 2, action: InputAction.START, x: 20 }),
      );
    scheduler.setHandler((e) => {
      seen.push(`${e.signal.id}:${e.signal.action}:${e.signal.x}`);
      if (e.signal.id === 1 && duringFrame) {
        start();
      }
    });
    scheduler.schedule(TaskPriority.VISUAL, event({ id: 1, x: 1 }));
    scheduler.schedule(TaskPriority.VISUAL, event({ id: 2, x: 10 }));
    if (!duringFrame) {
      start();
    }
    frame();
    expect(seen).not.toContain("2:MOVE:10");
    scheduler.schedule(TaskPriority.VISUAL, event({ id: 2, x: 30 }));
    frame();
    expect(seen.at(-1)).toBe("2:MOVE:30");
  },
);
