import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { ChartContext } from "../../../components/Chart/context";
import { createChartStore } from "../../../components/Chart/state/store/chart.store";
import { Announcer } from "../../../components/Chart/subcomponents/Announcer/Announcer";
import type { ContextValue } from "../../../components/Chart/types/context";

afterEach(cleanup);

it.each([false, true])(
  "announces dense ranges beyond browser argument limits (horizontal: %s)",
  (horizontal) => {
    const store = createChartStore({}, "x", "y");
    store.setState({
      data: Array.from({ length: 250000 }, (_, index) => ({
        x: index,
        y: index - 125000,
      })),
      processedSeries: [
        {
          id: "dense",
          label: "Dense",
          color: "purple",
          type: horizontal ? "bar" : "line",
          orientation: horizontal ? "horizontal" : "vertical",
        },
      ],
    });
    const view = render(
      <ChartContext.Provider value={{ chartStore: store } as ContextValue}>
        <Announcer summaryId="dense-summary" />
      </ChartContext.Provider>,
    );
    expect(
      view.container.querySelector("#dense-summary")?.textContent,
    ).toContain("250000 data points");
    expect(
      view.container.querySelector("#dense-summary")?.textContent,
    ).toContain(horizontal ? "X from 0 to 249999" : "Y from -125000 to 124999");
  },
);
