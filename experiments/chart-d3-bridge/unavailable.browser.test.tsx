import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { acquireWebGpuSurface } from "../../components/Chart/rendering/webgpu-surface";
import { hasWebGpu } from "../../tests/browser/Chart/webgpu-readback";
import { Proof } from "./Proof";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it.each(["missing API", "missing adapter"] as const)(
  "reports %s without publishing successful draw or interaction readiness",
  async (failure) => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "gpu");
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value:
        failure === "missing API"
          ? undefined
          : { requestAdapter: async () => null },
    });
    try {
      const view = render(<Proof initialCount={8} />);
      await expect
        .poll(
          () =>
            view.container.querySelectorAll('[data-gpu-unavailable="true"]')
              .length,
        )
        .toBe(2);
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      expect(
        view.container.querySelectorAll("[data-proof-ready-at]"),
      ).toHaveLength(0);
      expect(
        view.container.querySelectorAll("[data-proof-draw-at]"),
      ).toHaveLength(0);
      expect(
        view.getAllByText(
          failure === "missing API"
            ? /WebGPU is unavailable/
            : /WebGPU adapter is unavailable/,
        ),
      ).toHaveLength(2);
    } finally {
      cleanup();
      if (descriptor) {
        Object.defineProperty(navigator, "gpu", descriptor);
      } else {
        Reflect.deleteProperty(navigator, "gpu");
      }
    }
  },
);

it("shows dataset preparation failures instead of silently keeping the previous chart", async () => {
  vi.stubGlobal(
    "Worker",
    class {
      constructor() {
        throw new Error("Worker blocked by policy");
      }
    },
  );
  try {
    const view = render(<Proof initialCount={100000} />);
    await expect
      .poll(() => view.container.textContent)
      .toContain("Dataset preparation failed: Worker blocked by policy");
  } finally {
    vi.unstubAllGlobals();
  }
});

it("ends the busy state when indexing fails after points have been drawn", async () => {
  const { prepareCompact } = await import("./compact-world");
  const buffers = prepareCompact(100000, 0, "raw");
  let deliver: (message: unknown) => void;
  let fail: () => void;
  vi.stubGlobal(
    "Worker",
    class {
      onmessage?: (event: { data: unknown }) => void;
      onerror?: (event: { message: string }) => void;
      postMessage() {
        deliver = (data) => this.onmessage?.({ data });
        fail = () => this.onerror?.({ message: "Indexing failed" });
      }
      terminate() {}
    },
  );
  try {
    const view = render(<Proof initialCount={100000} />);
    await expect.poll(() => typeof deliver).toBe("function");
    deliver!({
      stage: "draw",
      encoding: "raw",
      positions: buffers.positions,
      preparationMs: 1,
    });
    if (await hasWebGpu()) {
      await expect
        .poll(
          () =>
            view.container.querySelectorAll('[data-proof-count="100000"]')
              .length,
          { timeout: 10000 },
        )
        .toBe(2);
    }
    fail!();
    await expect
      .poll(
        () => [...view.container.querySelectorAll('[aria-busy="true"]')].length,
      )
      .toBe(0);
    await expect
      .poll(
        () =>
          view.queryAllByText("Interactions unavailable: Indexing failed")
            .length,
      )
      .toBe(2);
  } finally {
    vi.unstubAllGlobals();
  }
});

it("withdraws readiness during device loss and restores the affected chart independently", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    skip();
  }
  const view = render(<Proof initialCount={8} />);
  const primary = () =>
    view.container.querySelector('[data-proof-chart="Primary"]')!;
  const comparison = () =>
    view.container.querySelector('[data-proof-chart="Comparison"]')!;
  await expect
    .poll(() => view.container.querySelectorAll("[data-proof-ready-at]").length)
    .toBe(2);
  const surface = acquireWebGpuSurface(primary().querySelector("canvas")!);
  surface.device.destroy();
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .toBeNull();
  expect(comparison().querySelector("[data-proof-ready-at]")).not.toBeNull();
  surface.recover();
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .not.toBeNull();
  await expect
    .poll(() => primary().textContent?.includes("GPU rendering unavailable"))
    .toBe(false);
  expect(surface.error).toBeUndefined();
  surface.release();
});

it("can retry failed device restoration on a later interaction", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    skip();
  }
  const view = render(<Proof initialCount={8} />);
  const primary = () =>
    view.container.querySelector('[data-proof-chart="Primary"]')!;
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .not.toBeNull();
  const surface = acquireWebGpuSurface(primary().querySelector("canvas")!);
  const allocate = vi
    .spyOn(navigator.gpu, "requestAdapter")
    .mockResolvedValue(null);
  surface.device.destroy();
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .toBeNull();
  surface.recover();
  await expect.poll(() => allocate.mock.calls.length).toBeGreaterThanOrEqual(1);
  allocate.mockRestore();
  await userEvent.click(view.getByRole("button", { name: "Zoom in Primary" }));
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .not.toBeNull();
  await expect
    .poll(() => primary().textContent)
    .not.toContain("GPU rendering unavailable");
  surface.release();
});
