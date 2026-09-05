import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import { Chart } from "./Chart";

afterEach(cleanup);
const settle = () => new Promise((r) => setTimeout(r, 200));
const first = [
  { category: "A", value: 10 },
  { category: "B", value: -8 },
];
const second = [
  { category: "B", value: -4 },
  { category: "A", value: 20 },
];
function Example({ horizontal = false, rows = first, extra = true }) {
  return (
    <DesignSystemProvider>
      <Chart.Root
        data={rows}
        style={{ width: 650, height: 400 }}
        type="bar"
        x={horizontal ? "value" : "category"}
        y={horizontal ? "category" : "value"}
      >
        <Chart.Plot>
          <Chart.Grid />
          <Chart.Series
            barWidth={24}
            label="First"
            orientation={horizontal ? "horizontal" : "vertical"}
            stackId="total"
            type="bar"
          />
          {extra && (
            <Chart.Series
              barWidth={24}
              data={second}
              label="Second"
              orientation={horizontal ? "horizontal" : "vertical"}
              stackId="total"
              type="bar"
            />
          )}
          <Chart.Axis />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>
  );
}
for (const horizontal of [false, true]) {
  it(`renders aligned signed ${horizontal ? "horizontal" : "vertical"} stacks and hovers their own rows`, async () => {
    const { container, rerender } = render(<Example horizontal={horizontal} />);
    await settle();
    const bars = () =>
      Array.from(container.querySelectorAll<SVGPathElement>(".chart-bar"));
    const [a, b, b2, a2] = bars().map((el) => el.getBoundingClientRect());
    for (const box of [a, b, b2, a2]) {
      expect(horizontal ? box.height : box.width).toBeCloseTo(24);
      expect(horizontal ? box.width : box.height).toBeGreaterThan(5);
    }
    expect(horizontal ? a.right : a.top).toBeCloseTo(
      horizontal ? a2.left : a2.bottom,
    );
    expect(horizontal ? b.left : b.bottom).toBeCloseTo(
      horizontal ? b2.right : b2.top,
    );
    expect(horizontal ? a.top : a.left).toBeCloseTo(
      horizontal ? a2.top : a2.left,
    );
    await userEvent.hover(bars()[3]);
    await expect
      .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
      .toContain("Second:20");
    expect(
      container.querySelector("[data-chart-tooltip]")?.textContent,
    ).toContain("First:10");
    expect(
      container.querySelector("[data-chart-tooltip]")?.textContent,
    ).not.toContain("undefined");
    const root = container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    root.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
      .toContain("First:10");
    rerender(
      <Example
        extra={false}
        horizontal={horizontal}
        rows={[
          { category: "A", value: 100 },
          { category: "B", value: -80 },
        ]}
      />,
    );
    await settle();
    expect(bars()).toHaveLength(2);
    const svg = container.querySelector("svg")!.getBoundingClientRect();
    for (const bar of bars()) {
      const box = bar.getBoundingClientRect();
      expect(box.left).toBeGreaterThanOrEqual(svg.left);
      expect(box.right).toBeLessThanOrEqual(svg.right);
      expect(box.top).toBeGreaterThanOrEqual(svg.top);
      expect(box.bottom).toBeLessThanOrEqual(svg.bottom);
    }
    await userEvent.hover(bars()[0]);
    await expect
      .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
      .toContain("First:100");
    expect(
      container.querySelector("[data-chart-tooltip]")?.textContent,
    ).not.toContain("Second");
  });
}

it("keeps the actually hovered scatter row when x values repeat", async () => {
  const { container } = render(
    <Chart
      data={[
        { x: 1, y: 10 },
        { x: 1, y: 90 },
      ]}
      style={{ width: 600, height: 400 }}
      type="scatter"
      x="x"
      y="y"
    />,
  );
  await settle();
  await userEvent.hover(container.querySelectorAll("circle")[1]);
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("90");
  expect(
    container.querySelector("[data-chart-tooltip]")?.textContent,
  ).not.toContain(":10");
});

it("rounds outward stack caps but leaves the shared seam square", async () => {
  const { container } = render(<Example />);
  await settle();
  const bars = Array.from(
    container.querySelectorAll<SVGPathElement>(".chart-bar"),
  );
  const [inner, negativeInner, negativeOuter, outer] = bars;
  expect(inner.getAttribute("d")).not.toMatch(/A [1-9]/);
  expect(negativeInner.getAttribute("d")).not.toMatch(/A [1-9]/);
  expect(outer.getAttribute("d")).toMatch(/A [1-9]/);
  expect(negativeOuter.getAttribute("d")).toMatch(/A [1-9]/);
});

it("exposes horizontal category/value semantics in its live region and summary", async () => {
  const { container } = render(<Example horizontal />);
  await settle();
  const root = container.querySelector<HTMLElement>("[data-chart-container]")!;
  root.focus();
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .poll(() => container.querySelector('[role="status"]')?.textContent)
    .toContain("A: 10");
  const summary = container.querySelector(
    `#${CSS.escape(root.getAttribute("aria-describedby")!)}`,
  )?.textContent;
  expect(summary).toContain("-8");
  expect(summary).toContain("A");
  expect(summary).toContain("B");
});

it("centers automatic horizontal bars on numeric categories with function accessors", async () => {
  const { container } = render(
    <Chart.Root
      data={[
        { category: 1, value: 10 },
        { category: 2, value: 20 },
      ]}
      style={{ width: 600, height: 400 }}
      type="bar"
    >
      <Chart.Plot>
        <Chart.Series<{ category: number; value: number }>
          orientation="horizontal"
          type="bar"
          x={(d) => d.value}
          y={(d) => d.category}
        />
        <Chart.Axis />
      </Chart.Plot>
    </Chart.Root>,
  );
  await settle();
  const bars = Array.from(container.querySelectorAll(".chart-bar"));
  expect(bars).toHaveLength(2);
  const [a, b] = bars.map((el) => el.getBoundingClientRect());
  expect(a.width).toBeGreaterThan(50);
  expect(a.height).toBeGreaterThan(24);
  expect(b.top).toBeGreaterThan(a.bottom);
  await userEvent.hover(bars[1]);
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("20");
});

it("omits incompatible later bars with a diagnostic instead of drawing invalid marks", async () => {
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    const { container } = render(
      <Chart.Root
        data={first}
        style={{ width: 600, height: 400 }}
        type="bar"
        x="category"
        y="value"
      >
        <Chart.Plot>
          <Chart.Series orientation="vertical" type="bar" />
          <Chart.Series
            orientation="horizontal"
            type="bar"
            x="value"
            y="category"
          />
        </Chart.Plot>
      </Chart.Root>,
    );
    await settle();
    expect(warnings.flat().join(" ")).toContain("orientation");
    expect(container.querySelectorAll(".chart-bar")).toHaveLength(2);
    for (const mark of container.querySelectorAll(".chart-bar")) {
      expect(mark.getAttribute("d")).not.toContain("NaN");
    }
  } finally {
    console.warn = originalWarn;
  }
});

it("inherits the first explicit horizontal orientation for an omitted sibling", async () => {
  const { container } = render(
    <Chart.Root
      data={first}
      style={{ width: 600, height: 400 }}
      type="bar"
      x="value"
      y="category"
    >
      <Chart.Plot>
        <Chart.Series
          barWidth={24}
          label="First"
          orientation="horizontal"
          stackId="s"
          type="bar"
        />
        <Chart.Series
          barWidth={24}
          data={second}
          label="Second"
          stackId="s"
          type="bar"
        />
        <Chart.Axis />
      </Chart.Plot>
    </Chart.Root>,
  );
  await settle();
  const bars = Array.from(container.querySelectorAll(".chart-bar"));
  expect(bars).toHaveLength(4);
  const [a, , , a2] = bars.map((el) => el.getBoundingClientRect());
  expect(a.right).toBeCloseTo(a2.left);
  expect(a.height).toBeCloseTo(24);
  await userEvent.hover(bars[3]);
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("Second:20");
  expect(bars[3].getAttribute("aria-label")).toContain("A: 20");
});

it("reaches categories present only in a later series with keyboard input", async () => {
  const { container } = render(
    <Chart.Root
      data={[{ category: "A", value: 10 }]}
      style={{ width: 600, height: 400 }}
      type="bar"
      x="value"
      y="category"
    >
      <Chart.Plot>
        <Chart.Series
          label="First"
          orientation="horizontal"
          stackId="s"
          type="bar"
        />
        <Chart.Series
          data={[{ category: "C", value: 30 }]}
          label="Second"
          stackId="s"
          type="bar"
        />
      </Chart.Plot>
    </Chart.Root>,
  );
  await settle();
  container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{ArrowDown}{ArrowDown}");
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("Second:30");
  expect(container.querySelector('[role="status"]')?.textContent).toBe("C: 30");
});

it("diagnoses and omits non-bar series on horizontal bar axes", async () => {
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    const { container } = render(
      <Chart.Root
        data={first}
        style={{ width: 600, height: 400 }}
        type="bar"
        x="value"
        y="category"
      >
        <Chart.Plot>
          <Chart.Series orientation="horizontal" type="bar" />
          <Chart.Series type="line" x="category" y="value" />
        </Chart.Plot>
      </Chart.Root>,
    );
    await settle();
    expect(warnings.flat().join(" ")).toContain("non-bar");
    expect(container.querySelectorAll(".chart-bar")).toHaveLength(2);
    expect(container.querySelectorAll("path:not(.chart-bar)")).toHaveLength(0);
  } finally {
    console.warn = originalWarn;
  }
});

it("never renders an explicitly rejected bar even when both scales are continuous", async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const { container } = render(
      <Chart.Root
        data={[
          { x: 0, y: 100 },
          { x: 10, y: 200 },
        ]}
        style={{ width: 600, height: 400 }}
        type="line"
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Chart.Series orientation="vertical" type="bar" />
          <Chart.Series
            data={[{ x: 10, y: 5 }]}
            orientation="horizontal"
            type="bar"
          />
        </Chart.Plot>
      </Chart.Root>,
    );
    await settle();
    expect(container.querySelectorAll(".chart-bar")).toHaveLength(2);
  } finally {
    console.warn = originalWarn;
  }
});
