import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartContext } from "../../context";
import {
  createChartStore,
  updateChartState,
} from "../../state/store/chart.store";
import type { ContextValue } from "../../types";
import { BarSeries } from "../BarSeries/BarSeries";
import { ScatterSeries } from "./ScatterSeries";

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
afterEach(cleanup);

describe.each(["scatter", "bubble", "vertical bar", "horizontal bar"] as const)(
  "%s sample validity",
  (mode) => {
    it.each(samples)(
      "renders only original valid samples for %s",
      (_, data, indices) => {
        const bar = mode.includes("bar");
        const horizontal = mode === "horizontal bar";
        const chartStore = createChartStore(
          { width: 400, height: 300, type: bar ? "bar" : "scatter" },
          horizontal ? "y" : "x",
          horizontal ? "x" : "y",
        );
        updateChartState(chartStore, {
          data,
          type: bar ? "bar" : "scatter",
          dimensions: chartStore.getState().dimensions,
        });
        const { container } = render(
          <ChartContext.Provider
            value={
              {
                chartStore,
                config: {},
                x: horizontal ? "y" : "x",
                y: horizontal ? "x" : "y",
              } as ContextValue<Row>
            }
          >
            <svg>
              {bar ? (
                <BarSeries
                  orientation={horizontal ? "horizontal" : "vertical"}
                  stackId="values"
                />
              ) : (
                <ScatterSeries size={mode === "bubble" ? "size" : undefined} />
              )}
            </svg>
          </ChartContext.Provider>,
        );
        const marks = container.querySelectorAll(
          bar ? ".chart-bar" : ".chart-scatter-series circle",
        );
        expect(
          Array.from(marks, (mark) =>
            Number(mark.getAttribute("data-chart-index")),
          ),
        ).toEqual(indices);
        for (const mark of marks) {
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
          }
        }
        expect(chartStore.getState().data).toBe(data);
      },
    );
  },
);
