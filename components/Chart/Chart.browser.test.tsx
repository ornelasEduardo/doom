/**
 * Chart — real browser coverage.
 *
 * Everything here needs a real layout engine. happy-dom reports 0x0 at the
 * viewport origin for every element, which turns the coordinate transform into
 * an identity and hides a whole class of bug — including the stale container
 * rect this work began with. It also never resolves CSS custom properties, so
 * anything asserting a computed colour has to run here.
 */
import "../../styles/globals.scss";

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import { Chart } from "./Chart";

const data = [
  { label: "A", value: 10 },
  { label: "B", value: 20 },
  { label: "C", value: 15 },
  { label: "D", value: 25 },
];

const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

const settle = async () => {
  await frame();
  await new Promise((r) => setTimeout(r, 120));
  await frame();
};

const hoverAt = async (el: Element, clientX: number, clientY: number) => {
  el.dispatchEvent(
    new PointerEvent("pointermove", {
      clientX,
      clientY,
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
      isPrimary: true,
    }),
  );
  await frame();
};

const leave = async (el: Element) => {
  el.dispatchEvent(
    new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }),
  );
  await frame();
};

const tooltipText = () =>
  document.querySelector("[data-chart-tooltip]")?.textContent ?? "";

/** Viewport centre of the nth rendered data point. */
const markCentre = (host: HTMLElement, index: number) => {
  const circle = host.querySelectorAll("circle")[index];
  expect(circle).toBeTruthy();
  const r = circle.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

let teardown: Array<() => void> = [];
afterEach(() => {
  teardown.forEach((fn) => fn());
  teardown = [];
  window.scrollTo(0, 0);
  document.body.style.removeProperty("height");
});

const mount = async (ui: React.ReactElement) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const result = render(
    <DesignSystemProvider initialTheme="default">{ui}</DesignSystemProvider>,
    { container: host },
  );
  teardown.push(() => {
    result.unmount();
    host.remove();
  });
  await settle();
  const root = host.querySelector("[data-chart-container]") as HTMLElement;
  expect(root).toBeTruthy();
  expect(root.getBoundingClientRect().height).toBeGreaterThan(0);
  return { host, root };
};

const chart = (extra: Record<string, unknown> = {}) => (
  <Chart
    d3Config={{ showDots: true }}
    data={data}
    style={{ width: 600, height: 360 }}
    type="line"
    x="label"
    y="value"
    {...extra}
  />
);

describe("Chart in a real browser", () => {
  it("resolves a hover to the mark under the pointer", async () => {
    const { host, root } = await mount(chart());

    const a = markCentre(host, 0);
    await hoverAt(root, a.x, a.y);
    expect(tooltipText()).toContain("A");

    const c = markCentre(host, 2);
    await hoverAt(root, c.x, c.y);
    expect(tooltipText()).toContain("C");
    expect(tooltipText()).not.toContain("A");
  });

  it("still resolves hovers after the page scrolls", async () => {
    document.body.style.height = "3000px";
    const { host, root } = await mount(chart());

    const before = markCentre(host, 0);
    await hoverAt(root, before.x, before.y);
    expect(tooltipText()).toContain("A");

    // Leave first: with no active hover there is nothing to clear, which is
    // the state that latches hit-testing off if the rect is stale.
    await leave(root);
    window.scrollTo(0, 500);
    await frame();

    const after = markCentre(host, 0);
    expect(Math.round(after.y)).not.toBe(Math.round(before.y));

    await hoverAt(root, after.x, after.y);

    expect(tooltipText()).toContain("A");
  });

  it("resolves hovers when the chart is not at the viewport origin", async () => {
    const { host, root } = await mount(chart());
    host.style.marginLeft = "137px";
    host.style.marginTop = "91px";
    await settle();

    expect(root.getBoundingClientRect().left).toBeGreaterThan(100);

    const a = markCentre(host, 0);
    await hoverAt(root, a.x, a.y);

    expect(tooltipText()).toContain("A");
  });

  it("does not leak hovers between two charts on one page", async () => {
    const { host: hostA, root: rootA } = await mount(chart());
    const { host: hostB, root: rootB } = await mount(
      chart({
        data: [
          { label: "P", value: 12 },
          { label: "Q", value: 22 },
          { label: "R", value: 17 },
          { label: "S", value: 27 },
        ],
      }),
    );

    const b = markCentre(hostB, 0);
    await hoverAt(rootB, b.x, b.y);
    expect(hostB.querySelector("[data-chart-tooltip]")?.textContent).toContain(
      "P",
    );
    expect(hostA.querySelector("[data-chart-tooltip]")?.textContent ?? "").toBe(
      "",
    );

    await leave(rootB);
    const a = markCentre(hostA, 0);
    await hoverAt(rootA, a.x, a.y);

    expect(hostA.querySelector("[data-chart-tooltip]")?.textContent).toContain(
      "A",
    );
  });

  it("resolves the series palette to distinct real colours", async () => {
    const { host } = await mount(
      <Chart.Root
        data={data}
        style={{ width: 600, height: 360 }}
        type="line"
        x="label"
        y="value"
      >
        <Chart.Plot>
          <Chart.Series label="One" type="line" x="label" y="value" />
          <Chart.Series label="Two" type="line" x="label" y="value" />
        </Chart.Plot>
      </Chart.Root>,
    );

    // happy-dom keeps `var(--chart-series-1)` as a literal string, so only a
    // real browser can prove the tokens cascade to actual, distinct colours.
    const strokes = Array.from(host.querySelectorAll("path"))
      .map((p) => getComputedStyle(p).stroke)
      .filter((c) => c && c !== "none");

    expect(strokes.length).toBeGreaterThanOrEqual(2);
    for (const stroke of strokes) {
      expect(stroke).toMatch(/^rgb/);
    }
    expect(new Set(strokes).size).toBeGreaterThan(1);
  });

  it("puts the tooltip on the system tooltip layer", async () => {
    const { host, root } = await mount(chart());
    const a = markCentre(host, 0);
    await hoverAt(root, a.x, a.y);

    const tooltip = document.querySelector(
      "[data-chart-tooltip]",
    ) as HTMLElement;
    expect(tooltip).toBeTruthy();

    // --z-tooltip is 500; a literal 10 would put the chart tooltip below
    // dropdowns, modals and drawers.
    expect(getComputedStyle(tooltip).zIndex).toBe("500");
  });

  it("keeps every categorical label when they all fit", async () => {
    // Six short categories across 600px fit comfortably.
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({
      label: m,
      value: (i + 1) * 10,
    }));

    const { host } = await mount(
      <Chart
        data={months}
        style={{ width: 600, height: 360 }}
        type="line"
        x="label"
        y="value"
      />,
    );

    const labels = Array.from(
      host.querySelectorAll('[aria-label="X Axis"] .tick text'),
    ).filter((t) => (t.textContent ?? "").trim().length > 0);

    expect(labels.map((t) => t.textContent)).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
    ]);
  });

  it("thins categorical axis labels instead of drawing one per row", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      label: `Category ${i}`,
      value: i + 1,
    }));

    const { host } = await mount(
      <Chart
        data={many}
        style={{ width: 600, height: 360 }}
        type="line"
        x="label"
        y="value"
      />,
    );

    const labels = Array.from(
      host.querySelectorAll('[aria-label="X Axis"] .tick text'),
    ).filter((t) => (t.textContent ?? "").trim().length > 0);

    expect(labels.length).toBeGreaterThan(0);
    expect(labels.length).toBeLessThanOrEqual(8);

    // With real text metrics, confirm the surviving labels do not overlap.
    const boxes = labels
      .map((t) => t.getBoundingClientRect())
      .sort((a, b) => a.left - b.left);
    for (let i = 1; i < boxes.length; i += 1) {
      expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i - 1].right - 1);
    }
  });

  it.each([
    ["shorthand", false],
    ["composition", true],
  ])("keeps the tooltip on screen in %s mode", async (_mode, composed) => {
    // Edge detection clamps to the viewport, not to the chart — a chart
    // tooltip is meant to float past its card rather than jump inward over the
    // data. The container rect is used only to convert the anchor into
    // absolute coordinates, and in composition mode Tooltip is handed a null
    // ref, so that conversion silently treats the chart as if it sat at the
    // viewport origin and the flip happens at the wrong moment.
    //
    // Pushed hard against the right edge so a missed flip leaves the screen.
    const { host, root } = await mount(
      composed ? (
        <Chart.Root
          d3Config={{ showDots: true }}
          data={data}
          style={{ width: 260, height: 300 }}
          type="line"
          x="label"
          y="value"
        >
          <Chart.Plot>
            <Chart.Series type="line" x="label" y="value" />
          </Chart.Plot>
        </Chart.Root>
      ) : (
        chart({ style: { width: 260, height: 300 } })
      ),
    );
    host.style.marginLeft = `${window.innerWidth - 280}px`;
    await settle();

    const marks = host.querySelectorAll("circle");
    const last = marks[marks.length - 1] ?? marks[0];
    const r = last.getBoundingClientRect();
    await hoverAt(root, r.left + r.width / 2, r.top + r.height / 2);

    const tooltip = host.querySelector("[data-chart-tooltip]") as HTMLElement;
    expect(tooltip?.textContent ?? "").not.toBe("");

    const box = tooltip.getBoundingClientRect();
    expect(box.right).toBeLessThanOrEqual(window.innerWidth + 1);
    expect(box.left).toBeGreaterThanOrEqual(-1);
  });

  it("keeps the full tick budget at ordinary dashboard sizes", async () => {
    // The complementary half of the responsive test below. Switching isMobile
    // from a viewport query to a container width silently pushed ordinary
    // 500px charts into the compact layout until the threshold was moved onto
    // the system scale.
    const { host } = await mount(
      <Chart
        d3Config={{ grid: true }}
        data={data}
        style={{ width: 500, height: 300 }}
        type="line"
        x="label"
        y="value"
      />,
    );

    // Assert the premise: 500 is comfortably above the 480 cutoff, so this
    // pins behaviour rather than platform font differences.
    const root = host.querySelector("[data-chart-container]") as HTMLElement;
    expect(Math.round(root.getBoundingClientRect().width)).toBe(500);

    const yTicks = host.querySelectorAll('[aria-label="Y Axis"] .tick');
    expect(yTicks.length).toBeGreaterThan(3);
  });

  it("adapts to its own width, not the window's", async () => {
    // A narrow chart in a wide viewport: a window query would call this
    // "desktop" and crowd a 320px plot with the full tick budget.
    const { host } = await mount(
      <Chart
        d3Config={{ grid: true }}
        data={data}
        style={{ width: 320, height: 240 }}
        type="line"
        x="label"
        y="value"
      />,
    );

    expect(window.innerWidth).toBeGreaterThan(600);
    const narrow = host.querySelector("[data-chart-container]") as HTMLElement;
    expect(Math.round(narrow.getBoundingClientRect().width)).toBe(320);

    const yTicks = host.querySelectorAll('[aria-label="Y Axis"] .tick');
    expect(yTicks.length).toBeGreaterThan(0);
    expect(yTicks.length).toBeLessThanOrEqual(3);
  });
});
