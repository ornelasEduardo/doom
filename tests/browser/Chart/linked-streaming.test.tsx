import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import {
  type Behavior,
  Chart,
  createInteractionChannel,
  DesignSystemProvider,
  type HoverInteraction,
  InputAction,
  type Sensor,
} from "../../../index";

interface Row {
  id: string;
  x: number;
  y: number;
}
afterEach(cleanup);

it("links semantic readings across charts and reprojects them through streaming updates", async () => {
  const remote =
    createInteractionChannel<HoverInteraction<Row>>("remote cursor");
  const listeners = new Set<(id: string) => void>();
  let latest: string | null = null;
  let mounts = 0;
  const publish: Sensor<Row> = (event) => {
    if (
      event.signal.action !== InputAction.MOVE ||
      !event.primaryCandidate?.data
    ) {
      return;
    }
    latest = event.primaryCandidate.data.id;
    for (const listener of listeners) {
      listener(latest);
    }
  };
  const linked = (): Behavior<Row> => (context) => {
    mounts++;
    const { chartStore, engine } = context.getChartContext();
    let lastRow: Row | undefined;
    let lastScales: unknown;
    let lastDimensions: unknown;
    const draw = () => {
      const state = chartStore.getState();
      const row = state.data.find((d) => d.id === latest);
      if (
        row === lastRow &&
        state.scales === lastScales &&
        state.dimensions === lastDimensions
      ) {
        return;
      }
      lastRow = row;
      lastScales = state.scales;
      lastDimensions = state.dimensions;
      if (!row || !state.scales.x || !state.scales.y) {
        context.removeInteraction(remote);
        return;
      }
      if (!("invert" in state.scales.x) || !("invert" in state.scales.y)) {
        return;
      }
      const x = state.scales.x(row.x);
      const y = state.scales.y(row.y);
      if (x === undefined || y === undefined) {
        return;
      }
      const anchor = engine.resolveContainerCoordinates(x, y);
      context.upsertInteraction(remote, {
        pointer: {
          x,
          y,
          containerX: anchor.x,
          containerY: anchor.y,
          isTouch: false,
        },
        targets: [
          {
            data: row,
            dataIndex: state.data.indexOf(row),
            coordinate: {
              x: x + state.dimensions.margin.left,
              y: y + state.dimensions.margin.top,
            },
          },
        ],
      });
    };
    listeners.add(draw);
    const stop = chartStore.subscribe(draw);
    draw();
    return () => {
      listeners.delete(draw);
      stop();
      context.removeInteraction(remote);
    };
  };
  const behaviors = [0, 1].map(() => [
    linked(),
    Chart.behaviors.Cursor({ on: remote, showX: true, showY: true }),
    Chart.behaviors.Tooltip({
      on: remote,
      render: ({ data }) => `${data[0].id}:${data[0].y}`,
    }),
  ]);
  const initial: Row[] = [
    { id: "a", x: 0, y: 10 },
    { id: "b", x: 1, y: 20 },
    { id: "c", x: 2, y: 30 },
  ];
  const fixture = (rows: Row[]) => (
    <DesignSystemProvider>
      <div style={{ display: "flex" }}>
        {[0, 1].map((region) => (
          <Chart
            key={region}
            behaviors={behaviors[region]}
            d3Config={{ showDots: true }}
            data={rows.map((row) => ({ ...row, y: row.y + region * 10 }))}
            sensors={[publish]}
            style={{ width: 500, height: 350 }}
            type="line"
            x="x"
            xDomain={[0, 4]}
            y="y"
            yDomain={[0, 80]}
          />
        ))}
      </div>
    </DesignSystemProvider>
  );
  const view = render(fixture(initial));
  const charts = view.container.querySelectorAll<HTMLElement>(
    "[data-chart-container]",
  );
  await expect.poll(() => charts[0].querySelectorAll("circle").length).toBe(3);
  await userEvent.hover(charts[0].querySelectorAll("circle")[1]);
  const readings = () =>
    [...charts].map(
      (chart) => chart.querySelector("[data-chart-tooltip]")?.textContent,
    );
  await expect.poll(readings).toEqual(["b:20", "b:30"]);
  view.rerender(
    fixture([
      { id: "b", x: 1, y: 35 },
      { id: "c", x: 2, y: 40 },
      { id: "d", x: 3, y: 45 },
      { id: "e", x: 4, y: 50 },
    ]),
  );
  await expect.poll(readings).toEqual(["b:35", "b:45"]);
  expect(mounts).toBe(2);
  expect(listeners.size).toBe(2);
  for (const chart of charts) {
    await expect
      .poll(() => {
        const mark = chart.querySelector("circle")!.getBoundingClientRect();
        const line = chart
          .querySelector('line[class*="cursorLine"]')!
          .getBoundingClientRect();
        return Math.abs(line.x + line.width / 2 - mark.x - mark.width / 2);
      })
      .toBeLessThan(1);
  }
  view.rerender(
    fixture([
      { id: "c", x: 2, y: 40 },
      { id: "d", x: 3, y: 45 },
    ]),
  );
  await expect.poll(readings).toEqual([undefined, undefined]);
  view.unmount();
  expect(listeners.size).toBe(0);
});
