import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartContext } from "../../context";
import {
  createChartStore,
  removeInteraction,
  upsertInteraction,
} from "../../state/store/chart.store";
import { Config, Series } from "../../types";
import { ContextValue } from "../../types/context";
import { InteractionChannel, InteractionTarget } from "../../types/interaction";
import { Announcer } from "./Announcer";

afterEach(cleanup);

const mount = (
  series: Series[],
  targets: InteractionTarget[],
  config: Config = {},
) => {
  const chartStore = createChartStore(config, "category", "value");
  chartStore.setState({ processedSeries: series });
  upsertInteraction(chartStore, InteractionChannel.PRIMARY_HOVER, { targets });
  render(
    <ChartContext.Provider value={{ chartStore } as ContextValue}>
      <Announcer summaryId="summary" />
    </ChartContext.Provider>,
  );
  return chartStore;
};

const target = (
  seriesId: string,
  data: unknown,
  dataIndex = 0,
): InteractionTarget => ({
  seriesId,
  data,
  dataIndex,
  coordinate: { x: 0, y: 0 },
});

const january = Date.UTC(2026, 0, 1);
const series: Series[] = [
  {
    id: "actual",
    label: "Actual",
    color: "red",
    type: "line",
    xAccessor: "date",
    yAccessor: "actual",
  },
  {
    id: "plan",
    label: "Plan",
    color: "blue",
    type: "line",
    xAccessor: (row: { period: number }) => row.period,
    yAccessor: (row: { planned: number }) => row.planned,
  },
];

describe("Announcer selected slice", () => {
  it("names every selected series using its own accessors and physical-axis formats", () => {
    mount(
      series,
      [
        target("actual", { date: january, actual: 12 }),
        target("plan", { period: january, planned: 18 }, 2),
      ],
      {
        axes: {
          x: {
            tickFormat: (value) =>
              new Date(Number(value)).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }),
          },
          y: { tickFormat: (value) => `$${value}` },
        },
      },
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Actual: January 2026: $12");
    expect(status.textContent).toContain("Plan: January 2026: $18");
    expect(status.textContent).not.toContain(String(january));
  });

  it("announces only selected members, including a slice missing its first series, and clears on dismissal", () => {
    const store = mount(series, [
      target("plan", { period: "February", planned: 18 }),
    ]);
    expect(screen.getByRole("status").textContent).toContain(
      "Plan: February: 18",
    );
    expect(screen.getByRole("status").textContent).not.toContain("Actual");
    act(() => removeInteraction(store, InteractionChannel.PRIMARY_HOVER));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("uses the Y category and X value format for horizontal bars", () => {
    mount(
      [
        {
          id: "bars",
          label: "Revenue",
          color: "red",
          type: "bar",
          orientation: "horizontal",
          xAccessor: "value",
          yAccessor: "category",
        },
      ],
      [target("bars", { category: "North", value: 30 })],
      {
        axes: {
          x: { tickFormat: (value) => `$${value}` },
          y: { tickFormat: (value) => `${value} region` },
        },
      },
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Revenue: North region: $30",
    );
  });

  it("retains unlabelled root-accessor and Date descriptions without a formatter", () => {
    mount(
      [],
      [target("default", { category: new Date(2026, 0, 1), value: 0 })],
    );
    expect(screen.getByRole("status").textContent).toBe(
      `${new Date(2026, 0, 1).toLocaleDateString()}: 0`,
    );
  });
});
