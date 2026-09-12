import { describe, expect, it, vi } from "vitest";

import { createChartStore } from "../state/store/chart.store";
import {
  type HoverInteraction,
  InteractionChannel,
} from "../types/interaction";
import * as channels from "./interactionChannels";

const setup = () =>
  channels.createInteractionAccess(createChartStore({ type: "line" }));

describe("typed interaction channels", () => {
  it("provides a channel factory", () => {
    expect(channels.createInteractionChannel).toBeTypeOf("function");
  });

  it("shares handles across contexts while isolating equal labels and chart instances", () => {
    const store = createChartStore({ type: "line" });
    const sensor = channels.createInteractionAccess(store);
    const behavior = channels.createInteractionAccess(store);
    const brush = channels.createInteractionChannel<{ start: number }>("brush");
    const other = channels.createInteractionChannel<{ start: number }>("brush");
    sensor.upsertInteraction(brush, { start: 4 });
    expect(behavior.getInteraction(brush)).toEqual({ start: 4 });
    expect(behavior.getInteraction(other)).toBeNull();
    expect(setup().getInteraction(brush)).toBeNull();
    behavior.removeInteraction(brush);
    expect(sensor.getInteraction(brush)).toBeNull();
  });

  it("subscribes selectively, preserves falsey payloads and defaults to Object.is", () => {
    const api = setup();
    const count = channels.createInteractionChannel<number>("count");
    const changes: Array<[number | null, number | null]> = [];
    const stop = api.subscribeInteraction(count, (next, previous) =>
      changes.push([next, previous]),
    );
    api.upsertInteraction(count, 0);
    api.upsertInteraction(count, 0);
    api.upsertInteraction(count, NaN);
    api.upsertInteraction(count, NaN);
    api.upsertInteraction(InteractionChannel.SELECTION, {
      selection: [],
      mode: "discrete",
    });
    expect(api.getInteraction(count)).toBeNaN();
    api.removeInteraction(count);
    api.removeInteraction(count);
    stop();
    api.upsertInteraction(count, 10);
    expect(changes).toEqual([
      [0, null],
      [NaN, 0],
      [null, NaN],
    ]);
  });

  it("honors custom equality", () => {
    const api = setup();
    const brush = channels.createInteractionChannel<{ start: number }>("brush");
    const starts: number[] = [];
    api.subscribeInteraction(
      brush,
      (value) => starts.push(value!.start),
      (a, b) => a?.start === b?.start,
    );
    api.upsertInteraction(brush, { start: 2 });
    api.upsertInteraction(brush, { start: 2 });
    api.upsertInteraction(brush, { start: 3 });
    expect(starts).toEqual([2, 3]);
  });

  it("publishes a batch atomically and reads staged writes", () => {
    const api = setup();
    const a = channels.createInteractionChannel<number>("a");
    const b = channels.createInteractionChannel<number>("b");
    const observed: Array<number | null> = [];
    api.subscribeInteraction(a, () => observed.push(api.getInteraction(b)));
    api.batchInteractions((batch) => {
      batch.upsertInteraction(a, 1);
      expect(batch.getInteraction(a)).toBe(1);
      expect(api.getInteraction(a)).toBeNull();
      batch.upsertInteraction(b, 2);
      batch.removeInteraction(a);
      batch.upsertInteraction(a, 3);
    });
    expect(observed).toEqual([2]);
    expect(api.getInteraction(a)).toBe(3);
  });

  it("discards failed batches and does not publish no-op batches", () => {
    const store = createChartStore({ type: "line" });
    const api = channels.createInteractionAccess(store);
    const channel = channels.createInteractionChannel<number>("number");
    let publications = 0;
    store.subscribe(() => publications++);
    expect(() =>
      api.batchInteractions((batch) => {
        batch.upsertInteraction(channel, 5);
        throw new Error("abort");
      }),
    ).toThrow("abort");
    expect(api.getInteraction(channel)).toBeNull();
    api.batchInteractions((batch) => {
      batch.upsertInteraction(channel, 1);
      batch.removeInteraction(channel);
    });
    expect(publications).toBe(0);
  });
});

it("rejects asynchronous batches before publishing staged state", () => {
  const api = setup();
  const channel = channels.createInteractionChannel<number>("async");
  expect(() =>
    api.batchInteractions((batch) => {
      batch.upsertInteraction(channel, 1);
      return Promise.resolve();
    }),
  ).toThrow("Interaction batches must be synchronous");
  expect(api.getInteraction(channel)).toBeNull();
});

it.each([false, true])(
  "isolates throwing subscribers from healthy subscribers (batch=%s)",
  (batch) => {
    const api = setup();
    const channel = channels.createInteractionChannel<number>("errors");
    const failure = new Error("consumer failed");
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    const received: Array<number | null> = [];
    api.subscribeInteraction(channel, () => {
      throw failure;
    });
    api.subscribeInteraction(channel, (next) => received.push(next));
    try {
      expect(() => {
        if (batch) {
          api.batchInteractions((draft) => {
            draft.upsertInteraction(channel, 1);
          });
        } else {
          api.upsertInteraction(channel, 1);
        }
      }).not.toThrow();
      expect(received).toEqual([1]);
      expect(api.getInteraction(channel)).toBe(1);
      expect(report).toHaveBeenCalledWith(
        "Interaction subscription error:",
        failure,
      );
      api.upsertInteraction(channel, 1);
      expect(received).toEqual([1]);
    } finally {
      report.mockRestore();
    }
  },
);

it("later subscribers observe latest committed state after a reentrant write", () => {
  const api = setup();
  const channel = channels.createInteractionChannel<number>("reentrant");
  const first: Array<number | null> = [];
  const later: Array<[number | null, number | null]> = [];
  api.subscribeInteraction(channel, (next) => {
    first.push(next);
    if (next === 1) {
      api.upsertInteraction(channel, 2);
    }
  });
  api.subscribeInteraction(channel, (next, previous) =>
    later.push([next, previous]),
  );
  api.upsertInteraction(channel, 1);
  expect(first).toEqual([1, 2]);
  expect(later).toEqual([[2, null]]);
  expect(api.getInteraction(channel)).toBe(2);
});

it.each([
  "selection",
  "drag",
  "cursor-config",
  "tooltip-config",
  "cursor-config:owner",
  "tooltip-config:owner",
  "tooltip-config:",
])(
  "rejects dynamically widened managed hover name %s without publishing",
  (name) => {
    const store = createChartStore<number>({});
    const api = channels.createInteractionAccess(store);
    const snapshot = store.getState();
    const hover = {
      targets: [],
      pointer: { x: 0, y: 0, containerX: 0, containerY: 0, isTouch: false },
    };
    const publications = vi.fn();
    store.subscribe(publications);
    expect(() => api.upsertHoverInteraction(name, hover)).toThrow(
      "cannot store managed hover",
    );
    expect(() =>
      api.batchInteractions((batch) => {
        batch.upsertHoverInteraction("remote-hover", hover);
        batch.upsertHoverInteraction(name, hover);
      }),
    ).toThrow("cannot store managed hover");
    expect(store.getState()).toBe(snapshot);
    expect(publications).not.toHaveBeenCalled();
  },
);

it("allows hover names and opaque handles whose diagnostic names are reserved", () => {
  const store = createChartStore<number>({});
  const api = channels.createInteractionAccess(store);
  const hover = {
    targets: [],
    pointer: { x: 0, y: 0, containerX: 0, containerY: 0, isTouch: false },
  };
  const handle =
    channels.createInteractionChannel<HoverInteraction<number>>("selection");
  api.upsertHoverInteraction(handle, hover);
  for (const name of [
    "primary-hover",
    "crosshair",
    "remote-hover",
    "tooltip-configured",
  ]) {
    api.upsertHoverInteraction(name, hover);
    expect(store.getState().interactions.get(name)).toBe(hover);
  }
  expect(api.getInteraction(handle)).toBe(hover);
});
