import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

it("separates the active dense-scatter point with a non-intercepting contrast ring", async () => {
  const view = render(
    <DesignSystemProvider>
      <Chart
        data={Array.from({ length: 1100 }, (_, x) => ({ x, y: 50 + (x % 7) }))}
        style={{ width: 600, height: 350 }}
        type="scatter"
        x="x"
        y="y"
      />
    </DesignSystemProvider>,
  );
  const chart = view.container.querySelector<HTMLElement>(
    "[data-chart-container]",
  )!;
  await expect
    .poll(() => chart.querySelector('[data-chart-gpu="ready"]'))
    .not.toBeNull();
  chart.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() => chart.querySelector(".chart-markers-layer circle"))
    .not.toBeNull();
  const marker = chart.querySelector<SVGCircleElement>(
    ".chart-markers-layer circle",
  )!;
  expect(getComputedStyle(marker).strokeWidth).toBe("4px");
  expect(getComputedStyle(marker).pointerEvents).toBe("none");
  expect(marker.getAttribute("stroke")).toBe("var(--card-bg)");
  const firstX = marker.getAttribute("cx");
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(() =>
      chart.querySelector(".chart-markers-layer circle")?.getAttribute("cx"),
    )
    .not.toBe(firstX);
  await userEvent.keyboard("{ArrowRight}".repeat(30));
  const selected = chart.querySelector<SVGCircleElement>(
    ".chart-markers-layer circle",
  )!;
  const location = new DOMPoint(
    selected.cx.baseVal.value,
    selected.cy.baseVal.value,
  ).matrixTransform(selected.getScreenCTM()!);
  await userEvent.keyboard("{Escape}");
  await expect
    .poll(() => chart.querySelectorAll(".chart-markers-layer circle").length)
    .toBe(0);
  await commands.moveChartPointer(location.x, location.y);
  await expect
    .poll(() => chart.querySelectorAll(".chart-markers-layer circle").length)
    .toBe(1);
  expect(
    getComputedStyle(chart.querySelector(".chart-markers-layer circle")!)
      .strokeWidth,
  ).toBe("4px");
});
