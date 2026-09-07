import "../../styles/globals.scss";

import { composeStories } from "@storybook/react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import * as stories from "./Chart.stories";

const { HorizontalBars, StackedBars, HorizontalStackedBars } =
  composeStories(stories);
afterEach(cleanup);

it("shows one unambiguous horizontal bar per support category", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <HorizontalBars />
    </DesignSystemProvider>,
  );
  await expect
    .poll(() => container.querySelectorAll(".chart-bar").length)
    .toBe(3);
  const bars = container.querySelectorAll<SVGPathElement>(".chart-bar");
  await userEvent.hover(bars[0]);
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toContain("Resolved tickets:36");
  expect(container.textContent).toContain("Billing");
});

for (const [Story, horizontal, expected] of [
  [StackedBars, false, ["Online ($k):36", "Retail ($k):18"]],
  [HorizontalStackedBars, true, ["Received units:36", "Shipped units:-18"]],
] as const) {
  it(`shows meaningful ${horizontal ? "signed inventory" : "revenue"} stacks with matching tooltips`, async () => {
    const { container } = render(
      <DesignSystemProvider>
        <Story />
      </DesignSystemProvider>,
    );
    await expect
      .poll(() => container.querySelectorAll(".chart-bar").length)
      .toBe(6);
    const bars = container.querySelectorAll<SVGPathElement>(".chart-bar");
    await userEvent.hover(bars[0]);
    for (const value of expected) {
      await expect
        .poll(
          () => container.querySelector("[data-chart-tooltip]")?.textContent,
        )
        .toContain(value);
    }
    const a = bars[0].getBoundingClientRect();
    const b = bars[3].getBoundingClientRect();
    expect(horizontal ? a.left : a.top).toBeCloseTo(
      horizontal ? b.right : b.bottom,
    );
  });
}

for (const [name, Story] of [
  ["signed line", composeStories(stories).SignedLineMetric],
  ["shared fixed bounds", composeStories(stories).SharedFixedYBounds],
] as const) {
  it(`paints endpoint dots over the Y axis in the ${name} story`, async () => {
    const { container } = render(
      <DesignSystemProvider>
        <Story />
      </DesignSystemProvider>,
    );
    await expect
      .poll(() => container.querySelector(".chart-line-series circle"))
      .toBeTruthy();
    for (const plot of container.querySelectorAll("[data-chart-plot]")) {
      const point = plot.querySelector(".chart-line-series circle")!;
      await expect.poll(() => plot.querySelectorAll(".domain").length).toBe(2);
      const axis = plot.querySelectorAll(".domain")[1];
      // SVG paints later siblings on top; axes ignore pointer events, so hit testing cannot detect this occlusion.
      expect(
        axis.compareDocumentPosition(point) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
}
