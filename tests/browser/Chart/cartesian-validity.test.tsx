import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import type { Store } from "../../../components/Chart/state/store/chart.store";
import {
  type HoverInteraction,
  InteractionChannel,
} from "../../../components/Chart/types";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

type Row = {
  x: number | null;
  y: number | null | undefined;
  size: number | null | undefined;
};
const sparse: Row[] = new Array(60);
sparse[1] = { x: 1, y: 10, size: 4 };
sparse[58] = { x: 58, y: 0, size: 0 };
const samples: [string, Row[], number[]][] = [
  [
    "nullable and nonfinite",
    [10, null, undefined, NaN, Infinity, -Infinity, 0].map((y, x) => ({
      x,
      y,
      size: 4,
    })),
    [0, 6],
  ],
  [
    "invalid category/X",
    [
      { x: null, y: 10, size: 4 },
      { x: Infinity, y: 10, size: 4 },
      { x: 2, y: 0, size: 0 },
    ],
    [2],
  ],
  ["sparse large", sparse, [1, 58]],
  [
    "absent rows",
    [
      null,
      { x: 1, y: 10, size: 4 },
      undefined,
      { x: 3, y: 0, size: 0 },
    ] as unknown as Row[],
    [1, 3],
  ],
  [
    "invalid optional size",
    [4, 0, null, undefined, NaN, Infinity, -1].map((size, x) => ({
      x,
      y: 10,
      size,
    })),
    [0, 1, 2, 3, 4, 5, 6],
  ],
  ["all invalid", [null, NaN, Infinity].map((y, x) => ({ x, y, size: 4 })), []],
];
function Capture({ save }: { save: (value: Store) => void }) {
  save(useChartContext().chartStore);
  return null;
}
const hover = (store: Store) =>
  store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER) as
    | HoverInteraction<Row>
    | undefined;
beforeEach(() => page.viewport(1200, 700));
afterEach(cleanup);

describe.each(["scatter", "bubble", "vertical bar", "horizontal bar"] as const)(
  "%s native sample validity",
  (mode) => {
    it.each(samples)(
      "renders and targets only valid samples for %s",
      async (_, data, indices) => {
        let store!: Store;
        const bar = mode.includes("bar");
        const horizontal = mode === "horizontal bar";
        const { container } = render(
          <DesignSystemProvider>
            <Chart.Root
              data={data}
              style={{ width: 600, height: 360 }}
              type={bar ? "bar" : "scatter"}
              x={horizontal ? "y" : "x"}
              y={horizontal ? "x" : "y"}
            >
              <Chart.Plot>
                <Capture
                  save={(value) => {
                    store = value;
                  }}
                />
                <Chart.Series
                  orientation={
                    bar ? (horizontal ? "horizontal" : "vertical") : undefined
                  }
                  size={mode === "bubble" ? "size" : undefined}
                  stackId={bar ? "values" : undefined}
                  type={bar ? "bar" : "scatter"}
                />
              </Chart.Plot>
            </Chart.Root>
          </DesignSystemProvider>,
        );
        await expect
          .poll(() => store.getState().dimensions.innerWidth)
          .toBeGreaterThan(0);
        const getMarks = () =>
          Array.from(
            container.querySelectorAll(
              bar ? ".chart-bar" : ".chart-scatter-series circle",
            ),
          );
        await expect
          .poll(() =>
            getMarks().map((mark) =>
              Number(mark.getAttribute("data-chart-index")),
            ),
          )
          .toEqual(indices);
        for (const mark of getMarks()) {
          for (const attr of ["cx", "cy", "r", "d"]) {
            expect(mark.getAttribute(attr) ?? "").not.toMatch(/NaN|Infinity/);
          }
          const index = Number(mark.getAttribute("data-chart-index"));
          if (mode === "bubble") {
            const size = data[index].size;
            expect(Number(mark.getAttribute("r"))).toBe(
              size === 4 ? 20 : size === 0 ? 4 : 6,
            );
          }
          if (bar && data[index].y === 0) {
            expect(mark.getAttribute("d")).toBe("");
            continue;
          }
          const box = mark.getBoundingClientRect();
          const x =
            box.left +
            box.width / 2 +
            (bar
              ? 0
              : Number(mark.getAttribute("cx")) <
                  store.getState().dimensions.innerWidth / 2
                ? 1
                : -1);
          const y =
            box.top +
            box.height / 2 +
            (bar
              ? 0
              : Number(mark.getAttribute("cy")) <
                  store.getState().dimensions.innerHeight / 2
                ? 1
                : -1);
          expect(document.elementsFromPoint(x, y)).toContain(mark);
          await commands.moveChartPointer(x, y);
          await expect
            .poll(() => hover(store)?.targets.map((target) => target.dataIndex))
            .toEqual([index]);
          expect(hover(store)?.targets[0].data).toBe(data[index]);
        }
        container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
        await userEvent.keyboard("{Escape}");
        for (const index of indices) {
          await userEvent.keyboard("{ArrowRight}");
          expect(
            hover(store)?.targets.map((target) => target.dataIndex),
          ).toEqual([index]);
        }
        if (!indices.length) {
          await userEvent.keyboard("{ArrowRight}");
          expect(hover(store)).toBeUndefined();
        }
      },
    );
  },
);

it("prepares mixed bar/scatter domains without dereferencing absent series rows", async () => {
  let store!: Store;
  const { container } = render(
    <DesignSystemProvider>
      <Chart.Root
        data={[{ category: "A", value: 5 }]}
        style={{ width: 600, height: 360 }}
        type="line"
        x="category"
        y="value"
      >
        <Chart.Plot>
          <Capture
            save={(value) => {
              store = value;
            }}
          />
          <Chart.Series data={[{ category: "A", value: 10 }]} type="bar" />
          <Chart.Series
            data={
              [
                null,
                { category: "B", value: 20 },
                undefined,
                { category: null, value: NaN },
              ] as unknown as { category: string; value: number }[]
            }
            type="scatter"
          />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>,
  );
  await expect
    .poll(() => store.getState().scales.x?.domain())
    .toEqual(["A", "B"]);
  expect(store.getState().scales.y!.domain()).toEqual([0, 20]);
  await expect
    .poll(
      () => container.querySelectorAll(".chart-scatter-series circle").length,
    )
    .toBe(1);
  const mark = container.querySelector(".chart-scatter-series circle")!;
  const box = mark.getBoundingClientRect();
  await commands.moveChartPointer(
    box.x + box.width / 2 - 1,
    box.y + box.height / 2 + 1,
  );
  await expect.poll(() => hover(store)?.targets[0].dataIndex).toBe(1);
});
