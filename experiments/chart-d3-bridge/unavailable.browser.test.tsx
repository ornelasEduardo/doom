import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { Proof } from "./Proof";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("reports unavailable rendering without publishing successful draw or interaction readiness", async () => {
  const getContext = HTMLCanvasElement.prototype.getContext;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (args[0] === "webgl2") {
        return null;
      }
      return getContext.apply(this, args);
    },
  );
  const view = render(<Proof initialCount={8} />);
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-gpu-unavailable="true"]').length,
    )
    .toBe(2);
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  expect(view.container.querySelectorAll("[data-proof-ready-at]")).toHaveLength(
    0,
  );
  expect(view.container.querySelectorAll("[data-proof-draw-at]")).toHaveLength(
    0,
  );
  expect(view.getAllByText(/WebGL2 is required/)).toHaveLength(2);
});

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
    await expect
      .poll(
        () =>
          view.container.querySelectorAll('[data-proof-count="100000"]').length,
        { timeout: 10000 },
      )
      .toBe(2);
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

it("withdraws readiness during context loss and restores the affected chart independently", async () => {
  const view = render(<Proof initialCount={8} />);
  const primary = () =>
    view.container.querySelector('[data-proof-chart="Primary"]')!;
  const comparison = () =>
    view.container.querySelector('[data-proof-chart="Comparison"]')!;
  await expect
    .poll(() => view.container.querySelectorAll("[data-proof-ready-at]").length)
    .toBe(2);
  const gl = primary().querySelector("canvas")!.getContext("webgl2")!;
  const extension = gl.getExtension("WEBGL_lose_context")!;
  expect(extension).toBeTruthy();
  extension.loseContext();
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .toBeNull();
  expect(comparison().querySelector("[data-proof-ready-at]")).not.toBeNull();
  extension.restoreContext();
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .not.toBeNull();
  await expect
    .poll(() => primary().textContent?.includes("GPU rendering unavailable"))
    .toBe(false);
  expect(gl.getError()).toBe(gl.NO_ERROR);
});

it("can retry failed context restoration on a later interaction", async () => {
  const view = render(<Proof initialCount={8} />);
  const primary = () =>
    view.container.querySelector('[data-proof-chart="Primary"]')!;
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .not.toBeNull();
  const gl = primary().querySelector("canvas")!.getContext("webgl2")!;
  const extension = gl.getExtension("WEBGL_lose_context")!;
  extension.loseContext();
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .toBeNull();
  const failAllocation = () => {
    throw new Error("GPU allocation failed");
  };
  const allocate = vi
    .spyOn(gl, "createProgram")
    .mockImplementationOnce(failAllocation)
    .mockImplementationOnce(failAllocation);
  extension.restoreContext();
  await expect.poll(() => allocate.mock.calls.length).toBeGreaterThanOrEqual(1);
  allocate.mockRestore();
  await userEvent.click(view.getByRole("button", { name: "Zoom in Primary" }));
  await expect
    .poll(() => primary().querySelector("[data-proof-ready-at]"))
    .not.toBeNull();
  await expect
    .poll(() => primary().textContent)
    .not.toContain("GPU rendering unavailable");
});
