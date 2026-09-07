import "../../../styles/globals.scss";

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { Chart } from "../../../components/Chart/Chart";
import type { Config } from "../../../components/Chart/types";
import type {
  Behavior,
  BehaviorContext,
} from "../../../components/Chart/types/events";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);
const rows = [
  { x: 0, y: 10 },
  { x: 1, y: 20 },
];

it.each(["configuration", "responsive width"])(
  "keeps an active behavior current after changing %s",
  async (change) => {
    let read!: () => ReturnType<BehaviorContext["getChartContext"]>;
    let setups = 0;
    let cleanups = 0;
    let advance!: () => number;
    const behavior: Behavior = (context) => {
      setups++;
      let count = 0;
      advance = () => ++count;
      read = context.getChartContext;
      return () => {
        cleanups++;
      };
    };
    const example = (width: number, label: string) => (
      <DesignSystemProvider>
        <Chart
          data={rows}
          x="x"
          y="y"
          type="line"
          behaviors={[behavior]}
          style={{ width, height: 360 }}
          d3Config={{ yAxisLabel: label }}
        >
          <Chart.Plot>
            <Chart.Series />
          </Chart.Plot>
        </Chart>
      </DesignSystemProvider>
    );
    const view = render(example(700, "Before"));
    await waitFor(() => expect(read).toBeDefined());
    const initialRead = read;
    const initialAdvance = advance;
    const initialSetups = setups;
    const initialCleanups = cleanups;
    expect(advance()).toBe(1);
    const root = view.container.querySelector("[data-chart-container]")!;
    expect(root.getBoundingClientRect().width).toBe(700);
    expect(read().isMobile).toBe(false);
    view.rerender(example(change === "responsive width" ? 300 : 700, "After"));
    if (change === "responsive width") {
      await waitFor(() => expect(root.getBoundingClientRect().width).toBe(300));
      await waitFor(() => expect(read().isMobile).toBe(true));
      view.rerender(example(700, "After"));
      await waitFor(() => expect(read().isMobile).toBe(false));
    } else {
      await waitFor(() => expect(read().config.yAxisLabel).toBe("After"));
    }
    expect(read).toBe(initialRead);
    expect(advance).toBe(initialAdvance);
    expect(advance()).toBe(2);
    expect(setups).toBe(initialSetups);
    expect(cleanups).toBe(initialCleanups);
    view.unmount();
    expect(cleanups).toBe(initialCleanups + 1);
  },
);

it.each([true, false])(
  "updates SVG layout when margins are added, changed, removed and reapplied (axes=%s)",
  async (showAxes) => {
    const example = (margin?: Config["margin"]) => (
      <DesignSystemProvider>
        <Chart
          data={rows}
          x="x"
          y="y"
          type="line"
          style={{ width: 700, height: 360 }}
          d3Config={{ showAxes, margin }}
        >
          <Chart.Plot>
            <Chart.Series />
          </Chart.Plot>
        </Chart>
      </DesignSystemProvider>
    );
    const view = render(example());
    const svg =
      view.container.querySelector<SVGSVGElement>("[data-chart-plot]")!;
    const plot = view.container.querySelector<SVGGElement>(
      "[data-chart-inner-plot]",
    )!;
    const rect = plot.querySelector("rect")!;
    await waitFor(() => expect(svg.width.baseVal.value).toBeGreaterThan(500));
    const first = { top: 25, right: 30, bottom: 35, left: 90 };
    const second = { top: 0, right: 0, bottom: 0, left: 0 };
    const defaults = showAxes
      ? { top: 20, right: 20, bottom: 40, left: 50 }
      : { top: 20, right: 10, bottom: 20, left: 10 };
    for (const [margin, expected] of [
      [first, first],
      [second, second],
      [undefined, defaults],
      [first, first],
    ] as const) {
      view.rerender(example(margin));
      await waitFor(() => {
        const origin = new DOMPoint(0, 0).matrixTransform(plot.getScreenCTM()!);
        const bounds = svg.getBoundingClientRect();
        expect(origin.x - bounds.left).toBeCloseTo(expected.left);
        expect(origin.y - bounds.top).toBeCloseTo(expected.top);
        expect(rect.width.baseVal.value).toBeCloseTo(
          bounds.width - expected.left - expected.right,
        );
        expect(rect.height.baseVal.value).toBeCloseTo(
          bounds.height - expected.top - expected.bottom,
        );
      });
    }
  },
);

it("restores axis-free SVG margins after removing an initial override", async () => {
  const example = (margin?: Config["margin"]) => (
    <DesignSystemProvider>
      <Chart
        data={rows}
        x="x"
        y="y"
        type="line"
        style={{ width: 700, height: 360 }}
        d3Config={{ showAxes: false, margin }}
      >
        <Chart.Plot>
          <Chart.Series />
        </Chart.Plot>
      </Chart>
    </DesignSystemProvider>
  );
  const view = render(example({ top: 25, right: 30, bottom: 35, left: 90 }));
  const plot = view.container.querySelector<SVGGElement>(
    "[data-chart-inner-plot]",
  )!;
  await waitFor(() =>
    expect(plot.transform.baseVal.getItem(0).matrix.e).toBe(90),
  );
  view.rerender(example());
  await waitFor(() => {
    expect(plot.transform.baseVal.getItem(0).matrix.e).toBe(10);
    expect(plot.transform.baseVal.getItem(0).matrix.f).toBe(20);
  });
});
