import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import {
  type Behavior,
  Chart,
  type Sensor,
} from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

interface Row {
  category: string;
  value: number;
}
const rows: Row[] = [
  { category: "A", value: 10 },
  { category: "B", value: 20 },
];
const forecast: Row[] = [
  { category: "A", value: 25 },
  { category: "B", value: 30 },
];

it.each([false, true])(
  "composes typed extensions with builtins (Root=%s)",
  async (composition) => {
    const observed: Row[] = [];
    const behaviorRows: Row[] = [];
    const contextTypes: string[] = [];
    const sensor: Sensor<Row> = (event, context) => {
      if (event.primaryCandidate?.data) {
        observed.push(event.primaryCandidate.data);
        contextTypes.push(context.getChartContext().config.type ?? "missing");
      }
    };
    const behavior: Behavior<Row> = ({ getChartContext }) => {
      behaviorRows.push(...getChartContext().chartStore.getState().data);
    };
    const Component = composition ? Chart.Root : Chart;
    const { container } = render(
      <DesignSystemProvider>
        <Component
          behaviors={[
            Chart.behaviors.Tooltip(),
            Chart.behaviors.Cursor(),
            behavior,
          ]}
          d3Config={{ showDots: true }}
          data={rows}
          sensors={[
            Chart.sensors.DataHoverSensor({ verticalSlice: true }),
            Chart.sensors.KeyboardSensor(),
            sensor,
          ]}
          style={{ width: 650, height: 400 }}
          type="line"
          x="category"
          y="value"
        >
          <Chart.Plot>
            <Chart.Series data={rows} label="Actual" type="line" />
            <Chart.Series data={forecast} label="Forecast" type="line" />
          </Chart.Plot>
        </Component>
      </DesignSystemProvider>,
    );
    const marks = () => container.querySelectorAll("circle");
    await expect.poll(() => marks().length).toBe(4);
    await expect
      .poll(() => marks()[1].getBoundingClientRect().width)
      .toBeGreaterThan(0);
    await userEvent.hover(marks()[1]);
    await expect.poll(() => observed).toContainEqual(rows[1]);
    await expect.poll(() => behaviorRows).toContainEqual(rows[0]);
    await expect.poll(() => contextTypes).toContain("line");
    const tooltip = () =>
      container.querySelector("[data-chart-tooltip]")?.textContent;
    await expect.poll(tooltip).toBe("BActual:20Forecast:30");
    await userEvent.hover(document.body);
    container.querySelector<HTMLElement>("[data-chart-container]")!.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(tooltip).toBe("AActual:10Forecast:25");
    await userEvent.keyboard("{Escape}");
    await expect.poll(tooltip).toBeUndefined();
  },
);

it("excludes nullable accessor categories from the browser bar domain", async () => {
  interface Sample {
    category?: string | number | null;
    value: number;
  }
  const samples: Sample[] = [
    { category: null, value: 1 },
    { value: 2 },
    { category: 0, value: 3 },
    { category: "0", value: 4 },
  ];
  let domain: unknown[] = [];
  const inspect: Behavior<Sample> = ({ getChartContext }) => {
    const { chartStore } = getChartContext();
    const read = () => {
      domain = chartStore.getState().scales.x?.domain() ?? [];
    };
    read();
    return chartStore.subscribe(read);
  };
  render(
    <DesignSystemProvider>
      <Chart
        behaviors={[inspect]}
        data={samples}
        style={{ width: 650, height: 400 }}
        type="bar"
        x={(row) => row.category}
        y="value"
      />
    </DesignSystemProvider>,
  );
  await expect.poll(() => domain).toEqual([0, "0"]);
});
