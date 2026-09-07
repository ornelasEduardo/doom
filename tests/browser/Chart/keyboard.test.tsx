import "../../../styles/globals.scss";

import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";

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
              tickFormat: (value) =>
                new Date(Number(value)).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }),
            },
            y: { tickFormat: (value) => `$${value}` },
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
          <button type="button">Apply</button>
        </Chart.Footer>
      </Chart.Root>
      <button type="button">After chart</button>
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

describe("Chart keyboard accessibility in Chromium", () => {
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

  it("formats horizontal category/value axes independently of custom tooltip content", async () => {
    const data = [{ region: "North", revenue: 30 }];
    const { container } = render(
      <Chart.Root
        behaviors={[
          Chart.behaviors.Tooltip({ render: () => "Custom details" }),
        ]}
        d3Config={{
          axes: {
            x: { tickFormat: (value) => `$${value}` },
            y: { tickFormat: (value) => `${value} region` },
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
