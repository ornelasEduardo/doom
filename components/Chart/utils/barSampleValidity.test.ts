import { expect, it } from "vitest";

import {
  createChartStore,
  updateChartDimensions,
} from "../state/store/chart.store";
import { stackSeries } from "./bars";

it.each([false, true])(
  "derives finite bar domains without evaluating absent rows (horizontal=%s)",
  (horizontal) => {
    const store = createChartStore(
      { type: "bar" },
      horizontal ? "value" : "category",
      horizontal ? "category" : "value",
    );
    store.setState({
      processedSeries: [
        {
          id: "bar",
          type: "bar",
          orientation: horizontal ? "horizontal" : "vertical",
          label: "bar",
          color: "red",
          xAccessor: horizontal ? "value" : "category",
          yAccessor: horizontal ? "category" : "value",
          data: [
            null,
            { category: "A", value: 10 },
            undefined,
            { category: null, value: 20 },
          ],
          stackRanges: [
            [0, 0],
            [0, 10],
            [0, 0],
            [0, 0],
          ],
        },
      ],
    });
    updateChartDimensions(store, 400, 300);
    expect(
      (horizontal
        ? store.getState().scales.y
        : store.getState().scales.x)!.domain(),
    ).toEqual(["A"]);
  },
);

it("keeps stacked totals and indices intact across invalid and absent samples", () => {
  const rows = [
    null,
    { category: "A", value: 10 },
    { category: "A", value: Infinity },
    { category: "A", value: 0 },
    undefined,
  ];
  const [first, second] = stackSeries([
    {
      id: "first",
      label: "first",
      color: "red",
      type: "bar",
      stackId: "stack",
      xAccessor: "category",
      yAccessor: "value",
      data: rows,
    },
    {
      id: "second",
      label: "second",
      color: "red",
      type: "bar",
      stackId: "stack",
      xAccessor: "category",
      yAccessor: "value",
      data: [{ category: "A", value: 5 }],
    },
  ]);
  expect(first.data).toBe(rows);
  expect(second.stackRanges).toEqual([[10, 15]]);
  expect(first.stackRanges?.[3]).toEqual([10, 10]);
});

it("derives mixed bar and non-bar domains from present finite samples", () => {
  const store = createChartStore({ type: "line" }, "category", "value");
  store.setState({
    data: [{ category: "A", value: 5 }],
    processedSeries: [
      {
        id: "bar",
        type: "bar",
        label: "bar",
        color: "red",
        xAccessor: "category",
        yAccessor: "value",
        data: [{ category: "A", value: 10 }],
        stackRanges: [[0, 10]],
      },
      {
        id: "scatter",
        type: "scatter",
        label: "scatter",
        color: "red",
        xAccessor: "category",
        yAccessor: "value",
        data: [
          null,
          { category: "B", value: 20 },
          undefined,
          { category: null, value: NaN },
        ],
      },
    ],
  });
  updateChartDimensions(store, 400, 300);
  expect(store.getState().scales.x!.domain()).toEqual(["A", "B"]);
  expect(store.getState().scales.y!.domain()).toEqual([0, 20]);
});
