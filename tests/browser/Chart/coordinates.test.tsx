import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

const rows = Array.from({ length: 31 }, (_, i) => ({
  day: `January ${i + 1}`,
  actual: 50,
  forecast: 80,
}));
afterEach(cleanup);

function Example({ scale = "scale(0.75)", width = 800, id = "first" }) {
  return (
    <div
      data-testid={id}
      style={{ transform: scale, transformOrigin: "top left", width }}
    >
      <Chart.Root
        d3Config={{ showDots: true }}
        data={rows}
        style={{ width: "100%", height: 360 }}
        type="line"
        x="day"
        y="actual"
      >
        <Chart.Header title="Daily readings" />
        <Chart.Plot>
          <Chart.Series label="Actual" type="line" y="actual" />
          <Chart.Series label="Forecast" type="line" y="forecast" />
          <Chart.Axis />
        </Chart.Plot>
      </Chart.Root>
    </div>
  );
}

async function hoverNear(root: HTMLElement, index = 20) {
  const marks = () => root.querySelectorAll('circle[role="graphics-symbol"]');
  await expect.poll(() => marks().length).toBe(62);
  const mark = marks()[index];
  await expect
    .poll(() => mark.getBoundingClientRect().width)
    .toBeGreaterThan(0);
  const svg = root.querySelector("svg[data-chart-plot]")!;
  await expect
    .poll(() => Number(svg.getAttribute("width")))
    .toBe(svg.parentElement!.clientWidth);
  const rect = mark.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.bottom + 10;
  // A nearby empty point exercises the spatial index instead of a direct mark hit.
  expect(
    document
      .elementsFromPoint(x, y)
      .some((el) => el.matches('circle[role="graphics-symbol"]')),
  ).toBe(false);
  await userEvent.hover(svg, {
    position: { x: x - svgRect.left, y: y - svgRect.top },
  });
  await expect
    .poll(() => root.querySelector("[data-chart-tooltip]")?.textContent)
    .toBe(`January ${index + 1}Actual:50Forecast:80`);
}

it.each(["scale(0.75)", "scale(1.1, 0.8)"])(
  "selects January 21 near its mark through %s",
  async (scale) => {
    const { container } = render(
      <DesignSystemProvider>
        <Example scale={scale} />
      </DesignSystemProvider>,
    );
    await hoverNear(container);
  },
);

it("maps native hover after ancestor scrolling and chart resizing", async () => {
  const { container, rerender } = render(
    <DesignSystemProvider>
      <div
        data-testid="scroll"
        style={{ overflow: "auto", height: 500, width: 1000 }}
      >
        <div style={{ height: 150 }} />
        <Example />
        <div style={{ height: 600 }} />
      </div>
    </DesignSystemProvider>,
  );
  const scroller = container.querySelector('[data-testid="scroll"]')!;
  scroller.scrollTop = 100;
  await hoverNear(container);
  rerender(
    <DesignSystemProvider>
      <div
        data-testid="scroll"
        style={{ overflow: "auto", height: 500, width: 1000 }}
      >
        <div style={{ height: 150 }} />
        <Example scale="scale(0.9)" width={680} />
        <div style={{ height: 600 }} />
      </div>
    </DesignSystemProvider>,
  );
  await expect
    .poll(
      () =>
        container
          .querySelector("[data-chart-container]")
          ?.getBoundingClientRect().width,
    )
    .toBeCloseTo(612, 0);
  await hoverNear(container, 23);
});

it("keeps differently scaled chart instances independent", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <div style={{ display: "flex", gap: 10 }}>
        <Example width={600} />
        <Example id="second" scale="scale(0.8)" width={600} />
      </div>
    </DesignSystemProvider>,
  );
  const first = container.querySelector<HTMLElement>('[data-testid="first"]')!;
  const second = container.querySelector<HTMLElement>(
    '[data-testid="second"]',
  )!;
  await hoverNear(first);
  await hoverNear(second, 24);
  await expect
    .poll(() => first.querySelector("[data-chart-tooltip]")?.textContent ?? "")
    .toBe("");
});

it("preserves exact DOM hits on scaled bars away from their spatial centers", async () => {
  const sensors = [Chart.sensors.DataHoverSensor({ exactHit: true })];
  const { container } = render(
    <DesignSystemProvider>
      <div style={{ transform: "scale(0.75)", transformOrigin: "top left" }}>
        <Chart
          data={[{ day: "January 21", value: 100 }]}
          sensors={sensors}
          style={{ width: 800, height: 400 }}
          type="bar"
          x="day"
          y="value"
        >
          <Chart.Plot>
            <Chart.Series barWidth={20} type="bar" />
            <Chart.Axis />
          </Chart.Plot>
        </Chart>
      </div>
    </DesignSystemProvider>,
  );
  const bar = () => container.querySelector(".chart-bar")!;
  await expect
    .poll(() => bar()?.getBoundingClientRect().height ?? 0)
    .toBeGreaterThan(100);
  await userEvent.hover(bar(), {
    position: { x: bar().getBoundingClientRect().width / 2, y: 20 },
  });
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("January 21");
});
