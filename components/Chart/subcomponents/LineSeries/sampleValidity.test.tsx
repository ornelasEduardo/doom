import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartContext } from "../../context";
import { createChartStore } from "../../state/store/chart.store";
import type { ContextValue } from "../../types";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";
import { LineSeries } from "./LineSeries";

type Row = { x: number | null; y: number | null | undefined };
const margin = { top: 0, right: 0, bottom: 0, left: 0 };
afterEach(cleanup);

function draw(data: Row[], type: "line" | "area") {
  const chartStore = createChartStore(
    { width: 100, height: 100, margin },
    "x",
    "y",
  );
  chartStore.setState({
    data,
    scales: {
      x: d3.scaleLinear().domain([0, 4]).range([0, 100]),
      y: d3.scaleLinear().domain([0, 20]).range([100, 0]),
    },
  });
  return render(
    <ChartContext.Provider
      value={{ chartStore, config: {}, x: "x", y: "y" } as ContextValue<Row>}
    >
      <svg>
        <LineSeries showDots type={type} />
      </svg>
    </ChartContext.Provider>,
  );
}

describe.each(["line", "area"] as const)("%s sample validity", (type) => {
  it.each([
    ["leading", [null, 10, 20], "M25,50L50,0"],
    ["interior", [10, null, 20], "M0,50ZM50,0Z"],
    ["trailing", [10, 20, undefined], "M0,50L25,0"],
    ["nonfinite", [10, NaN, Infinity, -Infinity, 0], "M0,50ZM100,100Z"],
    ["all invalid", [null, undefined, NaN, Infinity], ""],
  ] as const)(
    "gaps %s samples without inventing zero",
    (_, values, expected) => {
      const { container } = draw(
        values.map((y, x) => ({ x, y })),
        type,
      );
      expect(
        container
          .querySelector('[aria-roledescription="line"]')
          ?.getAttribute("d"),
      ).toBe(expected);
      expect(container.querySelectorAll("circle")).toHaveLength(
        values.filter((v) => typeof v === "number" && Number.isFinite(v))
          .length,
      );
      for (const path of container.querySelectorAll("path")) {
        expect(path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
        expect((path.getAttribute("d")?.match(/M/g) ?? []).length).toBe(
          (expected.match(/M/g) ?? []).length,
        );
      }
    },
  );

  it("keeps sparse holes as gaps without calling accessors on them", () => {
    const data: Row[] = new Array(5);
    data[1] = { x: 1, y: 10 };
    data[3] = { x: 3, y: 0 };
    const { container } = draw(data, type);
    expect(
      container
        .querySelector('[aria-roledescription="line"]')
        ?.getAttribute("d"),
    ).toBe("M25,50ZM75,100Z");
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("omits missing and nonfinite X positions", () => {
    const { container } = draw(
      [
        { x: null, y: 10 },
        { x: NaN, y: 20 },
        { x: Infinity, y: 10 },
        { x: 3, y: 0 },
      ],
      type,
    );
    expect(
      container
        .querySelector('[aria-roledescription="line"]')
        ?.getAttribute("d"),
    ).toBe("M75,100Z");
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });
});

it("infers numeric X from the first valid sample and preserves missing-Y X positions", () => {
  const data: Row[] = new Array(5);
  data[1] = { x: null, y: 10 };
  data[2] = { x: 2, y: null };
  data[4] = { x: 4, y: 20 };
  const { xScale, yScale } = createScales(
    data,
    100,
    100,
    margin,
    (d) => d.x as number,
    (d) => d.y as number,
  );
  expect(xScale.domain()).toEqual([2, 4]);
  expect(yScale.domain()).toEqual([0, 22]);
});

it("ignores absent rows without evaluating their accessors", () => {
  const data = [null, { x: 2, y: 10 }, undefined, { x: 4, y: 20 }];
  const { xScale } = createScales(
    data,
    100,
    100,
    margin,
    (d) => d!.x,
    (d) => d!.y,
  );
  expect(xScale.domain()).toEqual([2, 4]);
});

it("preserves categorical X and finite numeric-string Y compatibility", () => {
  const data = [
    { x: "A", y: "0" },
    { x: "B", y: "20" },
  ];
  const { xScale, yScale } = createScales(
    data,
    100,
    100,
    margin,
    (d) => d.x,
    (d) => Number(d.y),
  );
  expect(xScale.domain()).toEqual(["A", "B"]);
  expect(yScale.domain()).toEqual([0, 22]);
});
