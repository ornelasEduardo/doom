import "../../../styles/globals.scss";

import { cleanup, render as renderReact, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { EngineEvent } from "../../../components/Chart/engine";
import { SensorContext } from "../../../components/Chart/types/events";
import { HoverInteraction } from "../../../components/Chart/types/interaction";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

const render = (ui: React.ReactElement) =>
  renderReact(<DesignSystemProvider>{ui}</DesignSystemProvider>);

const january = Date.UTC(2026, 0, 1);
const february = Date.UTC(2026, 1, 1);
const rows = [
  { date: january, actual: 12 },
  { date: february, actual: 200 },
];
const plan = [
  { period: february, planned: 18 },
  { period: january, planned: 16 },
];

afterEach(() => {
  cleanup();
  window.scrollTo(0, 0);
});

const mount = async () => {
  const result = render(
    <>
      <Chart.Root
        d3Config={{
          axes: {
            x: {
              valueFormat: (value) =>
                new Date(Number(value)).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }),
            },
            y: { valueFormat: (value) => `$${value}` },
          },
        }}
        data={rows}
        style={{ width: 600, height: 360 }}
        x="date"
        y="actual"
        yDomain={[0, 30]}
      >
        <Chart.Plot>
          <Chart.Series data={rows} label="Actual" type="line" />
          <Chart.Series
            data={plan}
            label="Plan"
            type="line"
            x={(row: { period: number }) => row.period}
            y={(row: { planned: number }) => row.planned}
          />
          <Chart.Axis />
        </Chart.Plot>
        <Chart.Footer>
          <input aria-label="Notes" defaultValue="abc" />
          <button tabIndex={0} type="button">
            Apply
          </button>
        </Chart.Footer>
      </Chart.Root>
      <button tabIndex={0} type="button">
        After chart
      </button>
    </>,
  );
  result.container.style.height = "3000px";
  const root = result.container.querySelector<HTMLElement>(
    "[data-chart-container]",
  )!;
  await expect
    .poll(() => root.querySelectorAll("path[data-chart-series]").length)
    .toBeGreaterThan(0);
  root.focus();
  return root;
};

describe("Chart keyboard accessibility in native browsers", () => {
  it.each(["empty", "offplot"])(
    "allows native arrow scrolling when no navigation is handled: %s",
    async (mode) => {
      const { container } = render(
        <Chart
          data={mode === "empty" ? [] : [{ x: 1, y: 12 }]}
          sensors={
            mode === "pointer-only"
              ? [Chart.sensors.DataHoverSensor()]
              : undefined
          }
          style={{ width: 600, height: 360 }}
          x="x"
          y="y"
          yDomain={mode === "offplot" ? [20, 30] : [0, 30]}
        />,
      );
      container.style.height = "3000px";
      const root = container.querySelector<HTMLElement>(
        "[data-chart-container]",
      )!;
      root.focus();
      window.scrollTo(0, 100);
      await userEvent.keyboard("{ArrowDown>}");
      await new Promise((resolve) => setTimeout(resolve, 150));
      await userEvent.keyboard("{/ArrowDown}");
      await expect.poll(() => window.scrollY).toBeGreaterThan(100);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(screen.getByRole("status").textContent).toBe("");
    },
  );

  it.each(["pointer-only", "duplicate", "custom-channel"])(
    "retains one baseline navigator with %s sensors",
    async (mode) => {
      let customIndex: number | undefined;
      const observeCustom = <T,>(
        _event: EngineEvent<T>,
        context: SensorContext<T>,
      ) => {
        customIndex = (
          context.getInteraction("custom") as HoverInteraction | null
        )?.target?.dataIndex;
      };
      const keyboard = Chart.sensors.KeyboardSensor();
      const sensors =
        mode === "pointer-only"
          ? [Chart.sensors.DataHoverSensor()]
          : mode === "duplicate"
            ? [keyboard, keyboard]
            : [Chart.sensors.KeyboardSensor({ name: "custom" }), observeCustom];
      const { container } = render(
        <Chart
          data={[
            { x: "A", y: 12 },
            { x: "B", y: 18 },
            { x: "C", y: 24 },
          ]}
          sensors={sensors}
          style={{ width: 600, height: 360 }}
          x="x"
          y="y"
        />,
      );
      container.style.height = "3000px";
      const root = container.querySelector<HTMLElement>(
        "[data-chart-container]",
      )!;
      await expect
        .poll(() => root.querySelectorAll("path[data-chart-series]").length)
        .toBeGreaterThan(0);
      root.focus();
      window.scrollTo(0, 100);
      await userEvent.keyboard("{ArrowDown}");
      await expect
        .poll(() => screen.getByRole("status").textContent)
        .toContain("A: 12");
      if (mode === "custom-channel") {
        expect(customIndex).toBe(0);
      }
      await userEvent.keyboard("{ArrowDown}");
      await expect
        .poll(() => screen.getByRole("status").textContent)
        .toContain("B: 18");
      if (mode === "custom-channel") {
        expect(customIndex).toBe(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(window.scrollY).toBe(100);
    },
  );

  it("keeps the scroll position while navigating all four arrow directions", async () => {
    await mount();
    window.scrollTo(0, 100);
    for (const key of ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"]) {
      await userEvent.keyboard(`{${key}}`);
      // Browser default scrolling animates after key dispatch.
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(window.scrollY).toBe(100);
    }
  });

  it("announces the complete selected slice and excludes offplot members without changing the shared tooltip", async () => {
    const root = await mount();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => screen.getByRole("status").textContent)
      .toContain("Actual: January 2026: $12");
    expect(screen.getByRole("status").textContent).toContain(
      "Plan: January 2026: $16",
    );
    const tooltip = () =>
      root.querySelector("[data-chart-tooltip]")?.textContent;
    expect(tooltip()).toContain("Actual:");
    expect(tooltip()).toContain("Plan:");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => screen.getByRole("status").textContent)
      .toContain("Plan: February 2026: $18");
    expect(screen.getByRole("status").textContent).not.toContain("Actual");
    expect(tooltip()).not.toContain("Actual:");
    expect(tooltip()).toContain("Plan:");
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => screen.getByRole("status").textContent).toBe("");
    expect(tooltip()).toBeUndefined();
  });

  it("agrees with index-formatted axis labels for reordered series", async () => {
    const data = [
      { category: "1", value: 12 },
      { category: "2", value: 20 },
    ];
    const planned = [
      { category: "2", value: 24 },
      { category: "1", value: 18 },
    ];
    const { container } = render(
      <Chart.Root
        d3Config={{
          axes: {
            x: { tickFormat: (_, index) => ["January", "February"][index] },
          },
        }}
        data={data}
        style={{ width: 800, height: 360 }}
        x="category"
        y="value"
      >
        <Chart.Plot>
          <Chart.Series data={data} label="Actual" />
          <Chart.Series data={planned} label="Plan" />
          <Chart.Axis />
        </Chart.Plot>
      </Chart.Root>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    await expect
      .poll(
        () =>
          root.querySelector('[aria-label="X Axis"] .tick text')?.textContent,
      )
      .toBe("January");
    root.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => screen.getByRole("status").textContent)
      .toBe("Actual: January: 12. Plan: January: 18");
  });

  it("does not assign an invented tick label to an off-tick reading", async () => {
    const { container } = render(
      <Chart
        d3Config={{
          axes: { x: { tickFormat: (_, index) => `Tick ${index}` } },
        }}
        data={[
          { x: 0, y: 12 },
          { x: 1.25, y: 18 },
          { x: 2, y: 24 },
        ]}
        style={{ width: 800, height: 360 }}
        x="x"
        y="y"
      />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    await expect
      .poll(() => root.querySelectorAll("path[data-chart-series]").length)
      .toBeGreaterThan(0);
    root.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect
      .poll(() => screen.getByRole("status").textContent)
      .toContain("1.25: 18");
    expect(screen.getByRole("status").textContent).not.toContain("Tick");
  });

  it("keeps candidate indices stable when long tick labels are thinned", async () => {
    const data = Array.from({ length: 8 }, (_, index) => ({
      category: `C${index}`,
      value: 12,
    }));
    const { container } = render(
      <Chart
        d3Config={{
          axes: { x: { tickFormat: (_, index) => `Long category ${index}` } },
        }}
        data={data}
        style={{ width: 360, height: 360 }}
        x="category"
        y="value"
      />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    await expect
      .poll(() => root.querySelectorAll('[aria-label="X Axis"] .tick').length)
      .toBeGreaterThan(0);
    await expect
      .poll(() => root.querySelectorAll('[aria-label="X Axis"] .tick').length)
      .toBeLessThan(8);
    const ticks = root.querySelectorAll<SVGGElement>(
      '[aria-label="X Axis"] .tick',
    );
    for (const tick of ticks) {
      const category = (tick as SVGGElement & { __data__: string }).__data__;
      expect(tick.textContent).toBe(`Long category ${category.slice(1)}`);
    }
    root.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect
      .poll(() => screen.getByRole("status").textContent)
      .toContain("Long category 1");
  });

  it("formats horizontal category/value axes independently of custom tooltip content", async () => {
    const data = [{ region: "North", revenue: 30 }];
    const { container } = render(
      <Chart.Root
        behaviors={[
          Chart.behaviors.Tooltip({ render: () => "Custom details" }),
        ]}
        d3Config={{
          axes: {
            x: { valueFormat: (value) => `$${value}` },
            y: { valueFormat: (value) => `${value} region` },
          },
        }}
        data={data}
        style={{ width: 600, height: 360 }}
        type="bar"
        x="revenue"
        y="region"
      >
        <Chart.Plot>
          <Chart.Series label="Revenue" orientation="horizontal" type="bar" />
          <Chart.Axis />
        </Chart.Plot>
      </Chart.Root>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    await expect.poll(() => root.querySelectorAll(".chart-bar").length).toBe(1);
    root.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => screen.getByRole("status").textContent)
      .toContain("Revenue: North region: $30");
    expect(root.querySelector("[data-chart-tooltip]")?.textContent).toBe(
      "Custom details",
    );
  });

  it("allows Tab traversal and nested text editing without changing chart selection", async () => {
    await mount();
    await userEvent.keyboard("{ArrowRight}");
    const status = screen.getByRole("status");
    await expect.poll(() => status.textContent).not.toBe("");
    const selected = status.textContent;
    await userEvent.tab();
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    input.setSelectionRange(2, 2);
    await userEvent.keyboard("{ArrowLeft}");
    expect(input.selectionStart).toBe(1);
    await userEvent.keyboard("{ArrowDown}{Escape}");
    expect(status.textContent).toBe(selected);
    await userEvent.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Apply" }),
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "After chart" }),
    );
  });
});
