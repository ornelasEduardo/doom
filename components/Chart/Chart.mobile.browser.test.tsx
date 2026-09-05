import "../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import { Chart } from "./Chart";
import { CompositionExample } from "./Chart.stories";

const settle = () => new Promise((resolve) => setTimeout(resolve, 250));
afterEach(cleanup);

it.each([320, 480, 800])(
  "fits composition controls and plot in a %ipx container",
  async (width) => {
    const Story = CompositionExample.render as React.ComponentType;
    const { container } = render(
      <DesignSystemProvider>
        <div style={{ width }}>
          <Story />
        </div>
      </DesignSystemProvider>,
    );
    await settle();
    const root = container.querySelector("[data-chart-container]")!;
    const bounds = root.getBoundingClientRect();
    const controls = container.querySelectorAll('[role="combobox"]');
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      const box = control.getBoundingClientRect();
      expect(box.width).toBeGreaterThan(80);
      expect(box.left).toBeGreaterThanOrEqual(bounds.left);
      expect(box.right).toBeLessThanOrEqual(bounds.right);
    }
    const plot = container
      .querySelector("[data-chart-plot]")!
      .getBoundingClientRect();
    const legend = Array.from(container.querySelectorAll("span")).find(
      (el) => el.textContent === "Series 1",
    )!;
    expect(legend.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      plot.bottom,
    );
    expect(plot.width).toBeGreaterThan(width - 80);
    expect(plot.height).toBeGreaterThan(80);
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
);

it("stacks header content only when its container cannot fit a row", async () => {
  const { container } = render(
    <div style={{ width: 800 }}>
      <Chart.Header title="Chart title" subtitle="Chart subtitle">
        <button style={{ width: 220 }}>Chart controls</button>
      </Chart.Header>
    </div>,
  );
  const host = container.firstElementChild as HTMLElement;
  const title = container.querySelector("h5")!;
  const controls = container.querySelector("button")!;
  expect(controls.getBoundingClientRect().left).toBeGreaterThan(
    title.getBoundingClientRect().right,
  );
  host.style.width = "280px";
  await settle();
  expect(controls.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    title.parentElement!.parentElement!.getBoundingClientRect().bottom,
  );
});

it("keeps composition hover aligned after shrinking and expanding", async () => {
  const Story = CompositionExample.render as React.ComponentType;
  const { container } = render(
    <DesignSystemProvider>
      <div style={{ width: 800 }}>
        <Story />
      </div>
    </DesignSystemProvider>,
  );
  const root = container.querySelector("[data-chart-container]")!;
  const host = root.parentElement!.parentElement!;
  for (const width of [800, 320, 800]) {
    host.style.width = `${width}px`;
    await settle();
    const dot = container.querySelectorAll("circle")[2];
    expect(dot).toBeTruthy();
    await userEvent.hover(dot);
    await settle();
    expect(
      container.querySelector("[data-chart-tooltip]")?.textContent,
    ).toContain("Mar");
    await userEvent.hover(document.body);
  }
});
