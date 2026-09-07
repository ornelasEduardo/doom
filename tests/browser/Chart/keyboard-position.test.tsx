import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

it("anchors keyboard cursors and tooltips to the selected point through layout changes", async () => {
  const { container, rerender } = render(example(40));
  const chart = container.querySelector<HTMLElement>("[data-chart-container]")!;
  await expect
    .poll(() => chart.querySelectorAll("circle").length)
    .toBeGreaterThan(0);
  chart.focus();
  for (const offset of [40, 100]) {
    rerender(example(offset));
    await userEvent.keyboard("{Escape}{ArrowRight}{ArrowRight}");
    await expect
      .poll(() => chart.querySelector("[data-chart-tooltip]"))
      .not.toBeNull();
    await expect
      .poll(() => {
        const point = chart
          .querySelectorAll("circle")[1]
          .getBoundingClientRect();
        const line = chart
          .querySelector('line[class*="cursorLine"]')!
          .getBoundingClientRect();
        return Math.abs(line.x + line.width / 2 - (point.x + point.width / 2));
      })
      .toBeLessThan(1);
    await expect
      .poll(() => {
        const point = chart
          .querySelectorAll("circle")[1]
          .getBoundingClientRect();
        const tip = chart
          .querySelector("[data-chart-tooltip]")!
          .getBoundingClientRect();
        return Math.abs(
          tip.y + tip.height / 2 - (point.y + point.height / 2 + 8),
        );
      })
      .toBeLessThan(1);
    await expect
      .poll(() => {
        const point = chart
          .querySelectorAll("circle")[1]
          .getBoundingClientRect();
        const tip = chart
          .querySelector("[data-chart-tooltip]")!
          .getBoundingClientRect();
        return Math.min(
          Math.abs(tip.left - (point.x + point.width / 2) - 24),
          Math.abs(point.x + point.width / 2 - tip.right - 24),
        );
      })
      .toBeLessThan(1);
  }
});

function example(offset: number) {
  return (
    <DesignSystemProvider>
      <Chart.Root
        d3Config={{ showDots: true }}
        data={[
          { x: 0, y: 20 },
          { x: 1, y: 25 },
          { x: 2, y: 30 },
        ]}
        style={{ width: 800, height: 600 }}
        title="Keyboard position"
        x="x"
        y="y"
        yDomain={[0, 50]}
      >
        <div style={{ height: offset, flexShrink: 0 }}>
          Header above the plot
        </div>
        <Chart.Plot>
          <Chart.Series label="Actual" type="line" />
          <Chart.Series
            data={[
              { x: 0, y: 22 },
              { x: 1, y: 27 },
              { x: 2, y: 32 },
            ]}
            label="Plan"
            type="line"
          />
          <Chart.Cursor />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>
  );
}
