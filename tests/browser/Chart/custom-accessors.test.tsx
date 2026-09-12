import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import { Store } from "../../../components/Chart/state/store/chart.store";
import {
  HoverInteraction,
  InteractionChannel,
  RenderFrame,
} from "../../../components/Chart/types";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

const root = [
  { x: 80, y: 10 },
  { x: 20, y: 90 },
];
const initial = [
  { time: 20, value: 30 },
  { time: 80, value: 50 },
];
const updated = [
  { time: 20, value: 60 },
  { time: 80, value: 40 },
];
type Row = (typeof initial)[number];

function draw({
  container,
  data,
  scales,
  chartDataAttrs,
  seriesId,
}: RenderFrame<Row>) {
  container
    .selectAll<SVGCircleElement, Row>("circle")
    .data(data)
    .join("circle")
    .attr("data-custom-point", "true")
    .attr(chartDataAttrs.TYPE, "data-point")
    .attr(chartDataAttrs.SERIES_ID, seriesId)
    .attr(chartDataAttrs.INDEX, (_, index) => index)
    .attr("cx", (row) => (scales.x as (value: number) => number)(row.time))
    .attr("cy", (row) => (scales.y as (value: number) => number)(row.value))
    .attr("r", 8);
}

it("keeps custom coordinates and multi-series tooltips after data and layout updates", async () => {
  let store: Store;
  function Probe() {
    store = useChartContext().chartStore;
    return null;
  }
  const tree = (data: Row[], width: number) => (
    <DesignSystemProvider>
      <Chart
        data={root}
        style={{ width, height: 400 }}
        x="x"
        xDomain={[0, 100]}
        y="y"
        yDomain={[0, 100]}
      >
        <Chart.Plot>
          <Chart.Series
            data={data}
            label="Custom"
            render={draw}
            x="time"
            y={(row) => row.value}
          />
          <Chart.Series label="Root" type="line" />
          <Probe />
        </Chart.Plot>
      </Chart>
    </DesignSystemProvider>
  );
  const view = render(tree(initial, 650));
  const mark = () =>
    view.container.querySelector<SVGCircleElement>("[data-custom-point]")!;
  const tooltip = () =>
    view.container.querySelector("[data-chart-tooltip]")?.textContent;
  await expect
    .poll(() => mark()?.getBoundingClientRect().width)
    .toBeGreaterThan(0);
  await userEvent.hover(mark());
  await expect
    .poll(tooltip)
    .toMatch(/^20(?:Custom:30Root:90|Root:90Custom:30)$/);
  view.rerender(tree(updated, 750));
  await expect
    .poll(tooltip)
    .toMatch(/^20(?:Custom:60Root:90|Root:90Custom:60)$/);
  for (const axis of ["x", "y"] as const) {
    await expect
      .poll(() => {
        const state = store.getState();
        const hover = state.interactions.get(
          InteractionChannel.PRIMARY_HOVER,
        ) as HoverInteraction;
        const coordinate = hover?.targets.find(
          (item) => item.seriesId === mark().getAttribute("data-chart-series"),
        )?.coordinate[axis];
        const expected =
          Number(mark().getAttribute(axis === "x" ? "cx" : "cy")) +
          state.dimensions.margin[axis === "x" ? "left" : "top"];
        return coordinate === undefined
          ? Infinity
          : Math.abs(coordinate - expected);
      })
      // DOM rectangles quantize SVG subpixels differently across browser engines.
      .toBeLessThan(0.02);
  }
});
