import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const data = [
  { x: 0, y: 2 },
  { x: 1, y: 8 },
  { x: 2, y: 4 },
];
function Fixture({ type }: { type: "line" | "area" | "bar" | "scatter" }) {
  return (
    <DesignSystemProvider>
      <Chart.Root
        data={data}
        style={{ width: 600, height: 400 }}
        type={type}
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Chart.Series label="Measurements" type={type} />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>
  );
}
it.each(["line", "area", "bar", "scatter"] as const)(
  "draws %s marks on the shared GPU surface and retains keyboard tooltips",
  async (type) => {
    const view = render(<Fixture type={type} />);
    await expect
      .poll(
        () =>
          view.container.querySelector<HTMLCanvasElement>("[data-chart-gpu]")
            ?.dataset.chartGpu,
      )
      .toBe("ready");
    const canvas =
      view.container.querySelector<HTMLCanvasElement>("[data-chart-gpu]")!;
    const gl = canvas.getContext("webgl2")!;
    window.dispatchEvent(new Event("resize"));
    const pixels = await new Promise<Uint8Array>((resolve) =>
      requestAnimationFrame(() => {
        const buffer = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(
          0,
          0,
          canvas.width,
          canvas.height,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          buffer,
        );
        resolve(buffer);
      }),
    );
    expect(pixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(
      true,
    );
    view.container
      .querySelector<HTMLElement>("[data-chart-container]")!
      .focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(
        () => view.container.querySelector("[data-chart-tooltip]")?.textContent,
      )
      .toContain("2");
    expect(gl.getError()).toBe(gl.NO_ERROR);
  },
);
it("shares one context across series and releases its canvas on unmount", async () => {
  const view = render(
    <DesignSystemProvider>
      <Chart.Root data={data} style={{ width: 600, height: 400 }} x="x" y="y">
        <Chart.Plot>
          <Chart.Series type="line" />
          <Chart.Series type="bar" />
          <Chart.Series type="scatter" />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>,
  );
  await expect
    .poll(
      () => view.container.querySelectorAll('[data-chart-gpu="ready"]').length,
    )
    .toBe(1);
  const canvas = view.container.querySelector("canvas")!;
  view.unmount();
  expect(canvas.isConnected).toBe(false);
});

it("keeps GPU output independent through context loss, restoration and a peer unmount", async () => {
  const a = render(<Fixture type="bar" />),
    b = render(<Fixture type="line" />);
  await expect
    .poll(
      () =>
        a.container.querySelector<HTMLCanvasElement>("[data-chart-gpu]")
          ?.dataset.chartGpu,
    )
    .toBe("ready");
  await expect
    .poll(
      () =>
        b.container.querySelector<HTMLCanvasElement>("[data-chart-gpu]")
          ?.dataset.chartGpu,
    )
    .toBe("ready");
  const first = a.container.querySelector<HTMLCanvasElement>("canvas")!,
    second = b.container.querySelector<HTMLCanvasElement>("canvas")!;
  const gl = first.getContext("webgl2")!;
  const loss = gl.getExtension("WEBGL_lose_context")!;
  loss.loseContext();
  await expect.poll(() => first.dataset.chartGpu).toBe("unavailable");
  expect(second.dataset.chartGpu).toBe("ready");
  loss.restoreContext();
  await expect.poll(() => first.dataset.chartGpu).toBe("ready");
  b.unmount();
  first.closest<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  await expect
    .poll(() => a.container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("8");
});

it("batches adjacent scatter marks into one GPU draw", async () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({
    x: i,
    y: (i % 7) + 1,
  }));
  const view = render(
    <DesignSystemProvider>
      <Chart.Root
        data={rows}
        style={{ width: 600, height: 400 }}
        type="scatter"
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Chart.Series type="scatter" />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>,
  );
  await expect
    .poll(
      () =>
        view.container.querySelector<HTMLCanvasElement>("[data-chart-gpu]")
          ?.dataset.chartGpu,
    )
    .toBe("ready");
  const canvas = view.container.querySelector<HTMLCanvasElement>("canvas")!;
  const gl = canvas.getContext("webgl2")!;
  const original = gl.drawArrays.bind(gl);
  let draws = 0;
  gl.drawArrays = (...args) => {
    draws++;
    original(...args);
  };
  try {
    window.dispatchEvent(new Event("resize"));
    await new Promise(requestAnimationFrame);
    expect(draws).toBe(1);
  } finally {
    gl.drawArrays = original;
  }
});

it("announces unavailable GPU rendering rather than silently showing a blank chart", async () => {
  const original = HTMLCanvasElement.prototype.getContext;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (args[0] === "webgl2") {
        return null;
      }
      return original.apply(this, args);
    },
  );
  const view = render(<Fixture type="bar" />);
  await expect
    .poll(() =>
      view
        .queryAllByRole("status")
        .map((node) => node.textContent)
        .join(" "),
    )
    .toContain("GPU rendering is unavailable");
  view.container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(
      () => view.container.querySelector("[data-chart-tooltip]")?.textContent,
    )
    .toContain("2");
});

it.each([undefined, '[data-chart-type="scatter"]'])(
  "dims dense GPU scatter with selector %s without double opacity",
  async (selector) => {
    const rows = Array.from({ length: 1100 }, (_, i) =>
      i < 2 ? { x: 20 + i * 60, y: 20 + i * 60 } : { x: 200 + i, y: 200 },
    );
    const view = render(
      <DesignSystemProvider>
        <Chart.Root
          behaviors={
            selector
              ? [Chart.behaviors.Dim({ selector }), Chart.behaviors.Tooltip()]
              : undefined
          }
          data={rows}
          style={{ width: 600, height: 400 }}
          type="scatter"
          x="x"
          xDomain={[0, 100]}
          y="y"
          yDomain={[0, 100]}
        >
          <Chart.Plot>
            <Chart.Series type="scatter" />
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>,
    );
    await expect
      .poll(
        () =>
          view.container.querySelector<HTMLCanvasElement>("canvas")?.dataset
            .chartGpu,
      )
      .toBe("ready");
    const root = view.container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    root.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(
        () => view.container.querySelector("[data-chart-tooltip]")?.textContent,
      )
      .toContain("20");
    const plot = view.container.querySelector<SVGGElement>(
      "[data-chart-inner-plot]",
    )!;
    const bounds = plot.querySelector<SVGRectElement>("rect")!;
    const svg = plot.ownerSVGElement!;
    const m = svg.getScreenCTM()!.inverse().multiply(plot.getScreenCTM()!);
    const position = new DOMPoint(
      bounds.width.baseVal.value * 0.8,
      bounds.height.baseVal.value * 0.2,
    ).matrixTransform(m);
    const canvas = root.querySelector<HTMLCanvasElement>("canvas")!,
      gl = canvas.getContext("webgl2")!;
    window.dispatchEvent(new Event("resize"));
    const alpha = await new Promise<number>((resolve) =>
      requestAnimationFrame(() => {
        const pixel = new Uint8Array(4),
          ratio = canvas.width / svg.width.baseVal.value;
        gl.readPixels(
          Math.round(position.x * ratio),
          canvas.height - 1 - Math.round(position.y * ratio),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixel,
        );
        resolve(pixel[3]);
      }),
    );
    expect(alpha).toBeGreaterThan(50);
    expect(alpha).toBeLessThan(100);
  },
);
