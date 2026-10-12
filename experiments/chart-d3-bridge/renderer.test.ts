import { afterEach, expect, it, vi } from "vitest";

import { createRenderer } from "./renderer";

afterEach(() => vi.useRealTimers());
const node = {};
const frame = (value: number, element = node) => ({
  value,
  container: { node: () => element },
});

it("keeps one resource and draws the latest frame once per animation frame", () => {
  vi.useFakeTimers();
  const draws: number[] = [];
  let starts = 0;
  let invalidate!: () => void;
  const renderer = createRenderer<ReturnType<typeof frame>>(
    (_frame, request) => {
      starts++;
      invalidate = request;
      return { draw: (next) => draws.push(next.value), dispose() {} };
    },
  );
  renderer.render(frame(1));
  renderer.render(frame(2));
  expect(starts).toBe(1);
  invalidate();
  invalidate();
  vi.advanceTimersByTime(20);
  expect(draws).toEqual([2]);
  renderer.dispose();
});

it("cancels pending work and releases the resource exactly once", () => {
  vi.useFakeTimers();
  let draws = 0;
  let stops = 0;
  const renderer = createRenderer(() => ({
    draw: () => draws++,
    dispose: () => stops++,
  }));
  renderer.render(frame(1));
  renderer.dispose();
  renderer.dispose();
  vi.advanceTimersByTime(20);
  expect(draws).toBe(0);
  expect(stops).toBe(1);
});

it("recreates resources on mount replacement and ignores stale invalidations", () => {
  vi.useFakeTimers();
  const requests: (() => void)[] = [];
  const draws: number[] = [];
  let stops = 0;
  const renderer = createRenderer<ReturnType<typeof frame>>(
    (_frame, invalidate) => {
      requests.push(invalidate);
      return { draw: (next) => draws.push(next.value), dispose: () => stops++ };
    },
  );
  renderer.render(frame(1));
  renderer.render(frame(2, {}));
  expect(stops).toBe(1);
  vi.advanceTimersByTime(20);
  expect(draws).toEqual([2]);
  requests[0]();
  vi.advanceTimersByTime(20);
  expect(draws).toEqual([2]);
  renderer.dispose();
  renderer.render(frame(3));
  vi.advanceTimersByTime(20);
  expect(draws).toEqual([2, 3]);
  renderer.dispose();
  expect(stops).toBe(3);
});
