import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import type { Store } from "../../../components/Chart/state/store/chart.store";
import {
  type HoverInteraction,
  InteractionChannel,
} from "../../../components/Chart/types";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

type Row = { x: number | null; y: number | null | undefined };
afterEach(cleanup);
function Capture({ save }: { save: (store: Store) => void }) {
  save(useChartContext().chartStore);
  return null;
}
const hover = (store: Store) =>
  store.getState().interactions.get(InteractionChannel.PRIMARY_HOVER) as
    | HoverInteraction<Row>
    | undefined;
// Aim one pixel inside the plot; rounded pointer coordinates can fall outside
// a fractional SVG endpoint even when Playwright targets the circle center.
const hoverMark = (mark: Element, store: Store) =>
  userEvent.hover(mark, {
    position: {
      x:
        Number(mark.getAttribute("cx")) <
        store.getState().dimensions.innerWidth / 2
          ? 6
          : 4,
      y:
        Number(mark.getAttribute("cy")) <
        store.getState().dimensions.innerHeight / 2
          ? 6
          : 4,
    },
  });
const sparse: Row[] = new Array(5);
sparse[1] = { x: 1, y: 10 };
sparse[3] = { x: 3, y: 0 };
const cases: [string, Row[], number[], number][] = [
  [
    "leading",
    [
      { x: 0, y: null },
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ],
    [1, 2],
    1,
  ],
  [
    "interior",
    [
      { x: 0, y: 10 },
      { x: 1, y: null },
      { x: 2, y: 20 },
    ],
    [0, 2],
    2,
  ],
  [
    "trailing",
    [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: undefined },
    ],
    [0, 1],
    1,
  ],
  [
    "nonfinite",
    [10, NaN, Infinity, -Infinity, 0].map((y, x) => ({ x, y })),
    [0, 4],
    2,
  ],
  [
    "invalid X",
    [
      { x: null, y: 10 },
      { x: NaN, y: 10 },
      { x: Infinity, y: 10 },
      { x: 3, y: 0 },
    ],
    [3],
    1,
  ],
  [
    "all invalid",
    [null, undefined, NaN, Infinity].map((y, x) => ({ x, y })),
    [],
    0,
  ],
  ["sparse", sparse, [1, 3], 2],
  ["all sparse", new Array<Row>(5), [], 0],
  [
    "absent rows",
    [null, { x: 1, y: 0 }, undefined, { x: 3, y: 20 }] as unknown as Row[],
    [1, 3],
    2,
  ],
];

function example(
  data: Row[],
  type: "line" | "area",
  save: (store: Store) => void,
  second?: Row[],
) {
  return (
    <DesignSystemProvider>
      <Chart.Root
        d3Config={{ showDots: true, grid: false, showAxes: false }}
        data={data}
        style={{ width: 600, height: 360 }}
        type={type}
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Capture save={save} />
          <Chart.Series label="First" type={type} />
          {second && <Chart.Series data={second} label="Second" type={type} />}
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>
  );
}

describe.each(["line", "area"] as const)("%s validity in Chromium", (type) => {
  it.each(cases)(
    "renders %s gaps and limits hover/keyboard to original valid indices",
    async (_, data, indices, segments) => {
      let store!: Store;
      const { container } = render(
        example(data, type, (value) => {
          store = value;
        }),
      );
      await expect
        .poll(() => store.getState().dimensions.innerWidth)
        .toBeGreaterThan(0);
      await expect
        .poll(
          () => container.querySelectorAll(".chart-line-series circle").length,
        )
        .toBe(indices.length);
      for (const path of container.querySelectorAll<SVGPathElement>(
        ".chart-line-series path",
      )) {
        expect(path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
        expect((path.getAttribute("d")?.match(/M/g) ?? []).length).toBe(
          segments,
        );
        expect(Number.isFinite(path.getTotalLength())).toBe(true);
      }
      const marks = container.querySelectorAll(".chart-line-series circle");
      for (let i = 0; i < marks.length; i++) {
        await hoverMark(marks[i], store);
        await expect
          .poll(() => hover(store)?.targets.map((target) => target.dataIndex))
          .toEqual([indices[i]]);
        expect(hover(store)?.targets[0].data).toBe(data[indices[i]]);
      }
      container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
      await userEvent.keyboard("{Escape}");
      for (const index of indices) {
        await userEvent.keyboard("{ArrowRight}");
        expect(hover(store)?.targets.map((target) => target.dataIndex)).toEqual(
          [index],
        );
        expect(hover(store)?.targets[0].data).toBe(data[index]);
      }
      if (!indices.length) {
        await userEvent.keyboard("{ArrowRight}");
        expect(hover(store)).toBeUndefined();
        await userEvent.hover(container.querySelector("svg")!);
        expect(hover(store)?.targets ?? []).toEqual([]);
      }
    },
  );
});

it("keeps valid sibling series in shared tooltips when the primary sample is missing", async () => {
  let store!: Store;
  const first = [
    { x: 0, y: 10 },
    { x: 1, y: null },
    { x: 2, y: 20 },
  ];
  const second = [
    { x: 0, y: 12 },
    { x: 1, y: 0 },
    { x: 2, y: NaN },
  ];
  const { container } = render(
    example(
      first,
      "line",
      (value) => {
        store = value;
      },
      second,
    ),
  );
  await expect
    .poll(() => container.querySelectorAll(".chart-line-series").length)
    .toBe(2);
  const marks = container
    .querySelectorAll(".chart-line-series")[1]
    .querySelectorAll("circle");
  await hoverMark(marks[0], store);
  await expect.poll(() => hover(store)?.targets.length).toBe(2);
  await hoverMark(marks[1], store);
  await expect
    .poll(() => hover(store)?.targets.map((target) => target.data))
    .toEqual([second[1]]);
  expect(
    container.querySelector("[data-chart-tooltip]")?.textContent,
  ).toContain("Second:0");
  expect(
    container.querySelector("[data-chart-tooltip]")?.textContent,
  ).not.toContain("First");
  container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
  await userEvent.keyboard("{Escape}{ArrowRight}{ArrowRight}");
  expect(hover(store)?.targets.map((target) => target.data)).toEqual([
    second[1],
  ]);
  await userEvent.keyboard("{ArrowRight}");
  expect(hover(store)?.targets.map((target) => target.data)).toEqual([
    first[2],
  ]);
});

it("clears an active hover when its sample becomes invalid, and restores interaction with zero", async () => {
  let store!: Store;
  const save = (value: Store) => {
    store = value;
  };
  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
  ];
  const { container, rerender } = render(example(data, "line", save));
  await expect.poll(() => container.querySelectorAll("circle").length).toBe(2);
  await hoverMark(container.querySelector("circle")!, store);
  await expect.poll(() => hover(store)?.targets[0].dataIndex).toBe(0);
  rerender(example([{ x: 0, y: null }, data[1]], "line", save));
  await expect.poll(() => hover(store)?.targets ?? []).toEqual([]);
  rerender(example([{ x: 0, y: 0 }, data[1]], "line", save));
  await expect
    .poll(() => container.querySelectorAll(".chart-line-series circle").length)
    .toBe(2);
  await hoverMark(container.querySelector(".chart-line-series circle")!, store);
  await expect.poll(() => hover(store)?.targets[0].data.y).toBe(0);
});
