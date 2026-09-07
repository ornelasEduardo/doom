import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { ChartContext } from "../../context";
import { createChartStore } from "../../state/store/chart.store";
import type { ContextValue } from "../../types";
import { Announcer } from "./Announcer";

afterEach(cleanup);

it.each([false, true])(
  "summarizes present rows without calling accessors on absent rows (horizontal=%s)",
  (horizontal) => {
    const chartStore = createChartStore({}, "x", "y");
    chartStore.setState({
      data: [null, { x: 1, y: 0 }, undefined, { x: 3, y: 20 }],
      processedSeries: horizontal
        ? [
            {
              id: "bar",
              type: "bar",
              orientation: "horizontal",
              label: "Bar",
              color: "red",
            },
          ]
        : [],
    });
    const { container } = render(
      <ChartContext.Provider value={{ chartStore } as ContextValue}>
        <Announcer summaryId="summary" />
      </ChartContext.Provider>,
    );
    expect(container.querySelector("#summary")?.textContent).toContain(
      "2 data points",
    );
    expect(container.querySelector("#summary")?.textContent).toContain(
      "X from 1 to 3",
    );
    expect(container.querySelector("#summary")?.textContent).toContain(
      "Y from 0 to 20",
    );
  },
);

it("announces an empty chart when every row is absent", () => {
  const chartStore = createChartStore({}, "x", "y");
  chartStore.setState({ data: [null, undefined] });
  const { container } = render(
    <ChartContext.Provider value={{ chartStore } as ContextValue}>
      <Announcer summaryId="summary" />
    </ChartContext.Provider>,
  );
  expect(container.querySelector("#summary")?.textContent).toBe("Empty chart.");
});
