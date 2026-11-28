import { expect, it, vi } from "vitest";

import { createGpuPoints } from "./gpu";

it("initializes asynchronously without requesting a WebGL context", async () => {
  const canvas = document.createElement("canvas");
  const context = vi.spyOn(canvas, "getContext").mockReturnValue(null);
  const renderer = createGpuPoints(canvas);
  expect(renderer.ready).toBeInstanceOf(Promise);
  await renderer.ready;
  expect(context.mock.calls.every(([type]) => String(type) !== "webgl2")).toBe(
    true,
  );
  renderer.dispose();
});
