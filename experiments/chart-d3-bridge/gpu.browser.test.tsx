import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { SpatialMap } from "../../components/Chart/engine/SpatialMap";
import { createGpuPoints } from "./gpu";
import { Proof } from "./Proof";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("renders actual GPU pixels, retains buffers across viewport changes, and releases resources", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const gpu = createGpuPoints(canvas);
  const gl = canvas.getContext("webgl2")!;
  const upload = vi.spyOn(gl, "bufferData");
  const positions = new Float32Array([1 / 3, 1 / 3]);
  const data = { length: 1, buffers: () => ({ positions }) };
  const view = {
    width: 200,
    height: 200,
    plotWidth: 180,
    plotHeight: 180,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix().translate(10, 10),
    ratio: 1,
    radius: 4,
    color: [1, 0, 0, 1],
  };
  const pixel = (x: number, y: number) => {
    const rgba = new Uint8Array(4);
    gl.readPixels(x, 199 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    return Array.from(rgba);
  };
  gpu.draw(data, view);
  expect(pixel(70, 70)).toEqual([255, 0, 0, 255]);
  gpu.draw(data, { ...view, x: 20 });
  expect(pixel(90, 70)).toEqual([255, 0, 0, 255]);
  expect(pixel(70, 70)[3]).toBe(0);
  expect(upload).toHaveBeenCalledTimes(1);
  gpu.draw(
    {
      length: 1,
      buffers: () => ({ positions: new Float32Array([2 / 3, 1 / 3]) }),
    },
    view,
  );
  expect(pixel(130, 70)).toEqual([255, 0, 0, 255]);
  expect(upload).toHaveBeenCalledTimes(2);
  expect(gl.getError()).toBe(gl.NO_ERROR);
  const release = vi.spyOn(gl, "deleteBuffer");
  gpu.dispose();
  gpu.dispose();
  expect(release).toHaveBeenCalledTimes(2);
});

it("keeps the normal tooltip, keyboard targets, peer chart, and remount working with GPU marks", async () => {
  const view = render(<Proof initialCount={1000} />);
  const alpha = () =>
    view.container.querySelector("[data-proof-chart='Primary']")!;
  const surface = () => alpha()?.querySelector("[data-proof-surface='webgl']");
  await expect
    .poll(() => surface()?.getAttribute("data-proof-count"))
    .toBe("1000");
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="true"]').length,
    )
    .toBe(0);
  expect(alpha().querySelectorAll("[data-proof-point]")).toHaveLength(0);
  const root = () =>
    alpha().querySelector<HTMLElement>("[data-chart-container]")!;
  root().focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => alpha().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("80");
  const marker = alpha()
    .querySelector(".chart-markers-layer circle")!
    .getBoundingClientRect();
  await userEvent.keyboard("{ArrowRight}");
  await commands.moveChartPointer(
    marker.x + marker.width / 2,
    marker.y + marker.height / 2,
  );
  await expect
    .poll(() => alpha().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("80");
  await commands.zoomProofWheel();
  await expect
    .poll(() => alpha().querySelector("output")?.textContent)
    .not.toContain("1.00");
  await userEvent.click(view.getByRole("button", { name: "Reset Primary" }));
  await userEvent.click(view.getByRole("button", { name: "Zoom in Primary" }));
  await expect
    .poll(() => alpha().querySelector("output")?.textContent)
    .toContain("2.00");
  root().focus();
  await userEvent.keyboard("{Escape}{ArrowRight}");
  const plot = alpha().querySelector<SVGRectElement>("[data-proof-surface]")!
    .previousElementSibling as SVGRectElement;
  const width = Number(plot.getAttribute("width"));
  const height = Number(plot.getAttribute("height"));
  const expected = new DOMPoint(
    ((Math.log10(40) / 3) * 2 - 0.5) * width,
    ((1 - Math.log10(80) / 3) * 2 - 0.5) * height,
  ).matrixTransform(plot.getScreenCTM()!);
  await expect
    .poll(() => {
      const bounds = alpha()
        .querySelector(".chart-markers-layer circle")
        ?.getBoundingClientRect();
      return bounds
        ? Math.hypot(
            bounds.x + bounds.width / 2 - expected.x,
            bounds.y + bounds.height / 2 - expected.y,
          )
        : Infinity;
    })
    .toBeLessThan(1);
  expect(
    view.container.querySelector("[data-proof-chart='Comparison'] output")
      ?.textContent,
  ).toContain("1.00");
  await userEvent.click(view.getByRole("button", { name: "Reset Primary" }));
  const oldY = surface()?.getAttribute("data-proof-first-y");
  await userEvent.click(view.getByRole("button", { name: "Update data" }));
  await expect
    .poll(() => surface()?.getAttribute("data-proof-first-y"))
    .not.toBe(oldY);
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="true"]').length,
    )
    .toBe(0);
  root().focus();
  await userEvent.keyboard("{Escape}{ArrowRight}");
  await expect
    .poll(() => alpha().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("92");
  await userEvent.click(view.getByText("Lifecycle check"));
  await userEvent.click(view.getByRole("button", { name: "Unmount Primary" }));
  expect(alpha()).toBeNull();
  await userEvent.click(view.getByRole("button", { name: "Mount Primary" }));
  await expect
    .poll(() => surface()?.getAttribute("data-proof-count"))
    .toBe("1000");
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="true"]').length,
    )
    .toBe(0);
});

it("uploads changed visible slots only, defers offscreen slots, and flushes them when revealed", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const gpu = createGpuPoints(canvas),
    gl = canvas.getContext("webgl2")!;
  const positions = new Float32Array([1 / 3, 1 / 3, 1, 1]);
  const data = { length: 2, buffers: () => ({ positions }) };
  const view = {
    width: 200,
    height: 200,
    plotWidth: 180,
    plotHeight: 180,
    k: 2,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    ratio: 1,
    radius: 4,
    color: [1, 0, 0, 1],
  };
  gpu.draw(data, view);
  const full = vi.spyOn(gl, "bufferData"),
    partial = vi.spyOn(gl, "bufferSubData");
  positions[1] = 1 - Math.log10(200) / 3;
  positions[3] = 1 - Math.log10(2) / 3;
  gpu.patch([0, 1]);
  gpu.draw(data, view);
  expect(full).not.toHaveBeenCalled();
  expect(partial).toHaveBeenCalledTimes(1);
  expect((partial.mock.calls[0][2] as Float32Array).byteLength).toBe(8);
  const pixel = new Uint8Array(4);
  gl.readPixels(120, 115, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  expect(Array.from(pixel)).toEqual([255, 0, 0, 255]);
  gpu.draw(data, { ...view, k: 1 });
  expect(partial).toHaveBeenCalledTimes(2);
  expect(full).not.toHaveBeenCalled();
  gpu.dispose();
});

it("patches a focused point and its peer data without rebuilding chart indexes", async () => {
  const view = render(<Proof initialCount={1000} />);
  const alpha = () =>
    view.container.querySelector("[data-proof-chart='Primary']")!;
  await expect
    .poll(() =>
      alpha()
        ?.querySelector("[data-proof-count]")
        ?.getAttribute("data-proof-count"),
    )
    .toBe("1000");
  await expect
    .poll(
      () =>
        view.container.querySelectorAll('[data-proof-loading="true"]').length,
    )
    .toBe(0);
  alpha().querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => alpha().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("80");
  const before = alpha()
    .querySelector(".chart-markers-layer circle")!
    .getBoundingClientRect().y;
  const rebuild = vi.spyOn(SpatialMap.prototype, "updateIndex");
  view.getByRole("button", { name: "Edit points" }).click();
  await expect
    .poll(() => alpha().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("92");
  await expect
    .poll(
      () =>
        alpha()
          .querySelector(".chart-markers-layer circle")
          ?.getBoundingClientRect().y,
    )
    .not.toBe(before);
  expect(rebuild).not.toHaveBeenCalled();
  const beta = view.container.querySelector("[data-proof-chart='Comparison']")!;
  beta.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => beta.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("92");
});

it("uploads compact patches without reading records or recomputing projections", async () => {
  const { adoptCompact, prepareCompact } = await import("./compact-world");
  const world = adoptCompact(prepareCompact(8));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 200;
  const gpu = createGpuPoints(canvas);
  const view = {
    width: 200,
    height: 200,
    plotWidth: 200,
    plotHeight: 200,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    ratio: 1,
    radius: 3,
    color: [1, 0, 0, 1],
  };
  gpu.draw(world, view);
  world.patch([{ index: 0, x: 100, y: 10 }]);
  const get = vi.spyOn(world, "get");
  gpu.patch([0]);
  gpu.draw(world, view);
  expect(get).not.toHaveBeenCalled();
  expect(canvas.dataset.gpuPatched).toBe("1");
  gpu.dispose();
});

it("switches to counted density bins, refines on zoom, and preserves exact keyboard targets", async () => {
  const view = render(<Proof initialCount={10000} />);
  const primary = () =>
    view.container.querySelector('[data-proof-chart="Primary"]')!;
  await expect
    .poll(() => primary().querySelector("canvas")?.dataset.gpuDrawn)
    .toBe("10000");
  await userEvent.click(view.getByRole("combobox", { name: "Detail" }));
  await userEvent.click(view.getByRole("option", { name: "Adaptive density" }));
  await expect
    .poll(() => primary().querySelector("canvas")?.dataset.gpuDetail)
    .toBe("density");
  expect(
    Number(primary().querySelector("canvas")?.dataset.gpuDrawn),
  ).toBeLessThan(10000);
  primary().querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => primary().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("80");
  const plot = primary().querySelector("[data-proof-surface]")!
    .previousElementSibling as SVGRectElement;
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => primary().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("40");
  plot.scrollIntoView({ block: "center" });
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  const target = new DOMPoint(
    (Math.log10(40) / 3) * Number(plot.getAttribute("width")),
    (1 - Math.log10(80) / 3) * Number(plot.getAttribute("height")),
  ).matrixTransform(plot.getScreenCTM()!);
  expect(target.y).toBeGreaterThan(0);
  expect(target.y).toBeLessThan(innerHeight);
  await commands.moveChartPointer(0, 0);
  await commands.moveChartPointer(target.x, target.y);
  await expect
    .poll(() => primary().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("80");
  await userEvent.click(view.getByRole("button", { name: "Edit points" }));
  primary().querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{Escape}{ArrowRight}");
  await expect
    .poll(() => primary().querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("92");
  await userEvent.click(view.getByRole("button", { name: "Zoom in Primary" }));
  await expect
    .poll(() => primary().querySelector("output")?.textContent)
    .toContain("2.00");
  await userEvent.click(view.getByRole("combobox", { name: "Detail" }));
  await userEvent.click(view.getByRole("option", { name: "Every point" }));
  await expect
    .poll(() => primary().querySelector("canvas")?.dataset.gpuDrawn)
    .toBe("10000");
  expect(primary().querySelector("output")?.textContent).toContain("2.00");
});
