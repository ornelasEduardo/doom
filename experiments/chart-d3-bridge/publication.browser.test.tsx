import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { hasWebGpu } from "../../tests/browser/Chart/webgpu-readback";
import {
  adoptDrawing,
  type CompactWorld,
  prepareCompact,
} from "./compact-world";
import { trackPointUploads } from "./gpu-test-uploads";
import { Proof } from "./Proof";

let world: CompactWorld;
vi.mock("./useCompactWorld", () => ({
  useCompactWorld: () => ({ world, loading: !world.ready }),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("uploads edits made after index attachment but before geometry publication", async () => {
  const uploads = trackPointUploads();
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
  world.attachGrid({ grid: buffers.grid });
  world.patch([{ index: 0, x: 40, y: 92 }]);
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="false"]').length,
    )
    .toBe(2);
  await expect
    .poll(() => {
      const buffers = new Set(
        uploads.calls
          .filter(
            (call) =>
              Math.abs(call.values[1] - (1 - Math.log10(92) / 3)) < 1e-6,
          )
          .map((call) => call.buffer),
      );
      return buffers.size;
    })
    .toBe(2);
});

beforeEach(async ({ skip }) => {
  if (!(await hasWebGpu())) {
    skip();
  }
});
