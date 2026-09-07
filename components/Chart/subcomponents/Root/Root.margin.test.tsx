import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useChartContext } from "../../context";
import type { Config, ContextValue } from "../../types";
import { Root } from "./Root";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(300);
});
afterEach(() => vi.restoreAllMocks());

const rows = [
  { x: 0, y: 10 },
  { x: 1, y: 20 },
];

it.each([true, false])(
  "adds, replaces, removes and reapplies margins (showAxes=%s)",
  (showAxes) => {
    let context!: ContextValue;
    function Capture() {
      context = useChartContext();
      return null;
    }
    const example = (margin?: Config["margin"]) => (
      <Root
        d3Config={{ width: 600, height: 300, showAxes, margin }}
        data={rows}
        type="line"
        x="x"
        y="y"
      >
        <Capture />
      </Root>
    );
    const view = render(example());
    const expectedDefault = showAxes
      ? { top: 20, right: 20, bottom: 40, left: 50 }
      : { top: 20, right: 10, bottom: 20, left: 10 };
    const first = { top: 25, right: 30, bottom: 35, left: 90 };
    const second = { top: 0, right: 0, bottom: 0, left: 0 };
    for (const [margin, expected] of [
      [first, first],
      [second, second],
      [undefined, expectedDefault],
      [first, first],
    ] as const) {
      view.rerender(example(margin));
      const { dimensions } = context.chartStore.getState();
      expect(dimensions.margin).toEqual(expected);
      expect(dimensions.innerWidth).toBe(600 - expected.left - expected.right);
      expect(dimensions.innerHeight).toBe(300 - expected.top - expected.bottom);
    }
  },
);

it("restores current axes defaults when an initial override is removed", () => {
  let context!: ContextValue;
  function Capture() {
    context = useChartContext();
    return null;
  }
  const example = (config: Config) => (
    <Root d3Config={config} data={rows}>
      <Capture />
    </Root>
  );
  const view = render(
    example({ margin: { top: 30, right: 30, bottom: 30, left: 90 } }),
  );
  view.rerender(example({ showAxes: false }));
  expect(context.chartStore.getState().dimensions.margin).toEqual({
    top: 20,
    right: 10,
    bottom: 20,
    left: 10,
  });
});
