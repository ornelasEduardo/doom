import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cdp } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

const rows = [
  { month: "Jan", actual: 10, forecast: 20 },
  { month: "Feb", actual: 30, forecast: 40 },
  { month: "Mar", actual: 20, forecast: 30 },
];
const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
let touching = false;
const touch = async (
  type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
  point?: { x: number; y: number },
) => {
  if (type === "touchStart") {
    touching = true;
  }
  await cdp().send("Input.dispatchTouchEvent", {
    type,
    touchPoints: point ? [{ ...point, id: 1 }] : [],
  });
  if (type === "touchEnd" || type === "touchCancel") {
    touching = false;
  }
  await frame();
};
const tap = async (point: { x: number; y: number }) => {
  await touch("touchStart", point);
  await touch("touchEnd");
};
const centre = (element: Element) => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};
const mount = async () => {
  await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const result = render(
    <DesignSystemProvider>
      <div style={{ minHeight: 1800 }}>
        <Chart.Root
          data={rows}
          style={{ width: 600, height: 360 }}
          type="line"
          x="month"
          y="actual"
        >
          <Chart.Plot>
            <Chart.Series showDots label="Actual" type="line" y="actual" />
            <Chart.Series showDots label="Forecast" type="line" y="forecast" />
          </Chart.Plot>
        </Chart.Root>
        <button>Outside chart</button>
      </div>
    </DesignSystemProvider>,
  );
  await expect
    .poll(() => result.container.querySelectorAll("circle").length)
    .toBeGreaterThanOrEqual(6);
  await frame();
  const root = result.container.querySelector("[data-chart-container]")!;
  const live = root.querySelector('[aria-live="polite"]')!;
  const point = centre(root.querySelectorAll("circle")[1]);
  return { ...result, root, live, point };
};
afterEach(async () => {
  if (touching) {
    await touch("touchCancel");
  }
  await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
  cleanup();
  window.scrollTo(0, 0);
});

it("native tap retains the multi-series tooltip and live reading until an outside tap", async () => {
  const { container, root, live, point } = await mount();
  const events: PointerEvent[] = [];
  root.addEventListener("pointerdown", (event) =>
    events.push(event as PointerEvent),
  );
  await tap(point);
  expect(events[0].isTrusted).toBe(true);
  expect(events[0].pointerType).toBe("touch");
  await expect.poll(() => live.textContent).toContain("Feb");
  const tooltip = root.querySelector("[data-chart-tooltip]")!;
  expect(tooltip.textContent).toContain("30");
  expect(tooltip.textContent).toContain("40");
  await expect.poll(() => getComputedStyle(tooltip).opacity).toBe("1");
  await tap(centre(container.querySelector("button")!));
  await expect.poll(() => live.textContent).toBe("");
  await expect
    .poll(() => root.querySelector("[data-chart-tooltip]"))
    .toBeNull();
});

it("native cancellation clears the transient touch reading", async () => {
  const { root, live, point } = await mount();
  await touch("touchStart", point);
  await expect.poll(() => live.textContent).toContain("Feb");
  await touch("touchCancel");
  await expect.poll(() => live.textContent).toBe("");
  await expect
    .poll(() => root.querySelector("[data-chart-tooltip]"))
    .toBeNull();
});

it("native vertical swiping scrolls the page and clears inspection", async () => {
  const { root, live, point } = await mount();
  let cancelled = false;
  root.addEventListener("pointercancel", () => {
    cancelled = true;
  });
  await touch("touchStart", point);
  for (const distance of [5, 30, 70, 110]) {
    await touch("touchMove", { x: point.x, y: point.y - distance });
  }
  await touch("touchEnd");
  await expect.poll(() => window.scrollY).toBeGreaterThan(0);
  expect(cancelled).toBe(true);
  await expect.poll(() => live.textContent).toBe("");
});
