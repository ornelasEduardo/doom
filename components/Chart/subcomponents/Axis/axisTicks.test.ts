import { afterEach, expect, it, vi } from "vitest";

import { d3 } from "../../utils/d3";
import { renderAxisTicks } from "./axisTicks";

afterEach(() => vi.restoreAllMocks());

it("retains candidate indices when collision removal thins the axis", () => {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const categories = ["A", "B", "C"];
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const datum = (this as Element & { __data__: string }).__data__;
      const left = categories.indexOf(datum) * 15;
      return {
        left,
        right: left + 20,
        top: 0,
        bottom: 10,
        width: 20,
        height: 10,
        x: left,
        y: 0,
        toJSON: () => ({}),
      };
    },
  );
  renderAxisTicks(
    group,
    d3.axisBottom(
      d3.scalePoint<string | number>().domain(categories).range([0, 30]),
    ),
    {
      direction: "x",
      length: 100,
      defaultTickCount: 5,
      options: { tickFormat: (_, index) => `Period ${index}` },
    },
  );
  expect(
    Array.from(
      group.querySelectorAll(".tick text"),
      (label) => label.textContent,
    ),
  ).toEqual(["Period 0", "Period 2"]);
});

it("uses value formats for ticks unless an explicit tick formatter overrides them", () => {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const axis = d3.axisBottom(
    d3.scalePoint<string | number>().domain(["A", "B"]).range([0, 100]),
  );
  renderAxisTicks(group, axis, {
    direction: "x",
    length: 100,
    defaultTickCount: 5,
    options: { valueFormat: (value) => `Region ${value}` },
  });
  expect(
    Array.from(
      group.querySelectorAll(".tick text"),
      (label) => label.textContent,
    ),
  ).toEqual(["Region A", "Region B"]);
  renderAxisTicks(group, axis, {
    direction: "x",
    length: 100,
    defaultTickCount: 5,
    options: {
      valueFormat: (value) => `Region ${value}`,
      tickFormat: (_, index) => `Tick ${index}`,
    },
  });
  expect(
    Array.from(
      group.querySelectorAll(".tick text"),
      (label) => label.textContent,
    ),
  ).toEqual(["Tick 0", "Tick 1"]);
});
