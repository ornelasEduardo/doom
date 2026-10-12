import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import type { ContextValue } from "../../../components/Chart/types";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

type Row = { x: number; y: number | null; size: number };
const rows: Row[] = Array.from({ length: 5000 }, (_, index) => ({
  x: index + 1,
  y: index === 1 ? null : ((index * 37) % 100) + 1,
  size: index % 9,
}));
let context: ContextValue<Row>;
function Capture() {
  context = useChartContext<Row>();
  return null;
}
function Fixture({
  data = rows,
  show = true,
  other = false,
}: {
  data?: Row[];
  show?: boolean;
  other?: boolean;
}) {
  return (
    <DesignSystemProvider>
      <Chart.Root
        data={data}
        style={{ width: 600, height: 350 }}
        type="scatter"
        x="x"
        xDomain={[0, 5002]}
        y="y"
        yDomain={[0, 102]}
      >
        <Capture />
        <Chart.Plot>
          {show && (
            <Chart.Series
              color="red"
              label="Dense measurements"
              size="size"
              type="scatter"
            />
          )}
        </Chart.Plot>
      </Chart.Root>
      {other && (
        <Chart.Root
          data={[{ x: 1, y: 1 }]}
          style={{ width: 300, height: 200 }}
          type="scatter"
          x="x"
          y="y"
        >
          <Chart.Plot>
            <Chart.Series type="scatter" />
          </Chart.Plot>
        </Chart.Root>
      )}
    </DesignSystemProvider>
  );
}
afterEach(cleanup);
async function ready(container: HTMLElement) {
  await expect
    .poll(
      () =>
        container.querySelector<HTMLCanvasElement>("[data-chart-gpu]")?.dataset
          .chartGpu,
    )
    .toBe("ready");
}
function targetIndex() {
  return [...context.chartStore.getState().interactions.values()]
    .flatMap((interaction) =>
      "targets" in interaction ? (interaction.targets ?? []) : [],
    )
    .map((target) => target.dataIndex);
}

it("renders 5000 scatter rows as one GPU cloud, retaining exact hover, keyboard indices, and pixels", async () => {
  const view = render(<Fixture />);
  await ready(view.container);
  expect(
    view.container.querySelectorAll('[data-chart-gpu-mark="cloud"]'),
  ).toHaveLength(1);
  expect(view.container.querySelectorAll("circle").length).toBeLessThan(10);
  expect(view.container.querySelectorAll("*").length).toBeLessThan(100);
  expect(
    view.container
      .querySelector('[data-chart-gpu-mark="cloud"]')
      ?.getAttribute("aria-label"),
  ).toContain("4999");
  const root = view.container.querySelector<HTMLElement>(
    "[data-chart-container]",
  )!;
  root.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(targetIndex).toContain(0);
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(targetIndex).toContain(2);
  await userEvent.keyboard("{Escape}");

  const middle = 2500;
  const { scales, dimensions } = context.chartStore.getState();
  const x =
    (scales.x as (value: number) => number)(rows[middle].x) +
    dimensions.margin.left;
  const y =
    (scales.y as (value: number) => number)(rows[middle].y!) +
    dimensions.margin.top;
  const svg = root.querySelector("svg")!;
  const screen = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!);
  await commands.moveChartPointer(screen.x, screen.y);
  await expect.poll(targetIndex).toContain(middle);
  const selected = [...context.chartStore.getState().interactions.values()]
    .flatMap((interaction) =>
      "targets" in interaction ? (interaction.targets ?? []) : [],
    )
    .find((target) => target.dataIndex === middle);
  expect(selected?.data).toBe(rows[middle]);

  const canvas = root.querySelector<HTMLCanvasElement>("[data-chart-gpu]")!;
  const gl = canvas.getContext("webgl2")!;
  window.dispatchEvent(new Event("resize"));
  const pixel = await new Promise<Uint8Array>((resolve) =>
    requestAnimationFrame(() => {
      const pixel = new Uint8Array(4);
      const ratio = canvas.width / svg.width.baseVal.value;
      gl.readPixels(
        Math.round(x * ratio),
        canvas.height - 1 - Math.round(y * ratio),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel,
      );
      resolve(pixel);
    }),
  );
  expect(pixel[3]).toBeGreaterThan(0);
  expect(gl.getError()).toBe(gl.NO_ERROR);
});

it("replaces dense data, returns to small GPU circles, and releases only its own canvas", async () => {
  const view = render(<Fixture other />);
  await expect
    .poll(
      () => view.container.querySelectorAll('[data-chart-gpu="ready"]').length,
    )
    .toBe(2);
  expect(
    view.container.querySelectorAll('[data-chart-gpu-mark="cloud"]'),
  ).toHaveLength(1);
  const replacement = rows.map((row) => ({ ...row, y: 50 }));
  view.rerender(<Fixture other data={replacement} />);
  await ready(view.container);
  const root = view.container.querySelector<HTMLElement>(
    "[data-chart-container]",
  )!;
  root.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(
      () =>
        [...context.chartStore.getState().interactions.values()].flatMap(
          (interaction) =>
            "targets" in interaction ? (interaction.targets ?? []) : [],
        )[0]?.data,
    )
    .toBe(replacement[0]);
  view.rerender(<Fixture other data={replacement.slice(0, 3)} />);
  await expect
    .poll(() => root.querySelectorAll('[data-chart-gpu-mark="point"]').length)
    .toBe(3);
  expect(root.querySelector('[data-chart-gpu-mark="cloud"]')).toBeNull();
  view.rerender(<Fixture other show={false} />);
  await expect.poll(() => root.querySelector("[data-chart-gpu]")).toBeNull();
  expect(
    view.container.querySelectorAll('[data-chart-gpu="ready"]'),
  ).toHaveLength(1);
  const remaining = view.container.querySelector("canvas")!;
  view.unmount();
  expect(remaining.isConnected).toBe(false);
});
