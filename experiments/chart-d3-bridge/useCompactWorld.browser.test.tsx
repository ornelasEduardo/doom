import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { useCompactWorld } from "./useCompactWorld";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("reuses completed worker data after visiting a small dataset", async () => {
  const post = vi.spyOn(Worker.prototype, "postMessage");
  const { result, rerender } = renderHook(
    ({ count }) => useCompactWorld(count, 0, "raw"),
    { initialProps: { count: 100000 } },
  );
  await expect
    .poll(() => result.current.world.ready && !result.current.loading)
    .toBe(true);
  const completed = result.current.world;
  rerender({ count: 8 });
  rerender({ count: 100000 });
  act(() =>
    result.current.world.patch([
      { index: 0, x: result.current.world.get(0).requests, y: 123 },
    ]),
  );
  expect(result.current.world).toBe(completed);
  expect(result.current.world.get(0).latency).toBe(123);
  expect(post).toHaveBeenCalledTimes(1);
});
