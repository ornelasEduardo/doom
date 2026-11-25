import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { defineTheme } from "../../../styles/theming/defineTheme";
import { ThemeScope } from "../../../styles/theming/ThemeScope";

afterEach(cleanup);
const data = [
  { x: "January", y: 10 },
  { x: "February", y: 20 },
  { x: "March", y: 15 },
];
const behaviors = [
  Chart.behaviors.Markers(),
  Chart.behaviors.DraggablePuck(),
  Chart.behaviors.Tooltip(),
];
const config = { showDots: true, xAxisLabel: "Month" };
function identity(color: string, label: string) {
  return defineTheme({
    name: "Data",
    components: {
      Chart: {
        classNames: { dragPuck: label, marker: label },
        parts: {
          axes: { opacity: "0.86" },
          tickLine: { opacity: "0.91" },
          tickLabel: { fill: color },
          label: { fill: color },
          gridLine: { stroke: color },
          marker: { stroke: color, opacity: "0.73" },
          dragPuck: { stroke: color },
        },
      },
    },
  });
}
const violet = identity("rgb(90, 40, 100)", "violet");
const green = identity("rgb(35, 85, 40)", "green\tupdated");
function draw(theme: typeof violet) {
  return (
    <ThemeScope theme={theme}>
      <Chart
        behaviors={behaviors}
        d3Config={config}
        data={data}
        style={{ width: 640, height: 360 }}
        type="line"
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Chart.Grid />
          <Chart.Axis />
          <Chart.Series
            color="rgb(171, 72, 25)"
            data={data}
            label="Sales"
            type="line"
          />
        </Chart.Plot>
      </Chart>
    </ThemeScope>
  );
}

it("applies chart recipes to actual D3 axes, ticks, text and React grid lines", async () => {
  const { container } = render(draw(violet));
  const axis = () => container.querySelector('[aria-label="X Axis"]')!;
  await expect
    .poll(() => axis()?.querySelector("text") !== null && !!axis())
    .toBe(true);
  expect(getComputedStyle(axis().parentElement!).opacity).toBe("0.86");
  expect(getComputedStyle(axis().querySelector(".tick line")!).opacity).toBe(
    "0.91",
  );
  expect(getComputedStyle(axis().querySelector(".tick text")!).fill).toBe(
    "rgb(90, 40, 100)",
  );
  expect(
    getComputedStyle(container.querySelector("[data-chart-grid] line")!).stroke,
  ).toBe("rgb(90, 40, 100)");
  expect(
    getComputedStyle(container.querySelector('[data-doom-part="label"]')!).fill,
  ).toBe("rgb(90, 40, 100)");
});

it("retains the active datum and engine-created nodes while updating marker and puck styles", async () => {
  const { container, rerender } = render(draw(violet));
  const point = () => container.querySelectorAll('[role="graphics-symbol"]')[1];
  await expect
    .poll(() => point()?.getBoundingClientRect().width ?? 0)
    .toBeGreaterThan(0);
  await userEvent.hover(point());
  const marker = () => container.querySelector(".chart-markers-layer circle");
  await expect.poll(() => marker() !== null).toBe(true);
  const active = marker()!;
  const puck = container.querySelector(".drag-puck")!;
  const tooltip = () =>
    container.querySelector("[data-chart-tooltip]")?.textContent;
  await expect.poll(tooltip).toContain("February");
  expect(getComputedStyle(active).stroke).toBe("rgb(90, 40, 100)");
  expect(getComputedStyle(active).opacity).toBe("0.73");
  rerender(draw(green));
  await expect
    .poll(() => getComputedStyle(active).stroke)
    .toBe("rgb(35, 85, 40)");
  expect(marker()).toBe(active);
  expect(container.querySelector(".drag-puck")).toBe(puck);
  expect(getComputedStyle(puck).stroke).toBe("rgb(35, 85, 40)");
  expect(puck.classList.contains("violet")).toBe(false);
  expect(puck.classList.contains("green")).toBe(true);
  expect(puck.classList.contains("updated")).toBe(true);
  expect(getComputedStyle(point()).fill).toBe("rgb(171, 72, 25)");
  expect(tooltip()).toContain("February");
});
