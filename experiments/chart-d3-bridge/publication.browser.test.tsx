import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import {
  adoptDrawing,
  type CompactWorld,
  prepareCompact,
} from "./compact-world";
import { Proof } from "./Proof";

let world: CompactWorld;
vi.mock("./useCompactWorld", () => ({
  useCompactWorld: () => ({ world, loading: !world.ready }),
}));
afterEach(cleanup);

it("uploads edits made after index attachment but before geometry publication", async () => {
  const buffers = prepareCompact(8);
  world = adoptDrawing({
    values: buffers.values,
    positions: buffers.positions,
  });
  const view = render(<Proof initialCount={8} />);
  await expect
    .poll(
      () => view.container.querySelectorAll('[data-proof-count="8"]').length,
    )
    .toBe(2);
  const contexts = Array.from(
    view.container.querySelectorAll("canvas"),
    (canvas) => canvas.getContext("webgl2")!,
  ).filter(Boolean);
  expect(contexts).toHaveLength(2);
  world.attachGrid({ grid: buffers.grid });
  world.patch([{ index: 0, x: 40, y: 92 }]);
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="false"]').length,
    )
    .toBe(2);
  for (const gl of contexts) {
    const uploaded = new Float32Array(2);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, uploaded);
    expect(uploaded[1]).toBeCloseTo(1 - Math.log10(92) / 3, 6);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  }
});
