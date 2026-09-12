import "../../../styles/globals.scss";

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import {
  InputAction,
  InputSignal,
  InputSource,
} from "../../../components/Chart/engine";
import type { ContextValue, Sensor } from "../../../components/Chart/types";
import { createInteractionAccess } from "../../../components/Chart/utils/interactionChannels";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

it("keeps a native pointer tooltip through foreign stream cancellation", async () => {
  const data = [
    { x: "A", y: 10 },
    { x: "B", y: 20 },
    { x: "C", y: 15 },
  ];
  type Row = (typeof data)[number];
  let context!: ContextValue<Row>;
  let pointer!: InputSignal;
  const observe: Sensor<Row> = ({ signal }) => {
    if (signal.action === InputAction.MOVE) {
      pointer = signal;
    }
  };
  function Probe() {
    context = useChartContext<Row>();
    return null;
  }
  const view = render(
    <DesignSystemProvider>
      <Chart
        behaviors={[Chart.behaviors.Tooltip()]}
        d3Config={{ showDots: true }}
        data={data}
        sensors={[observe, Chart.sensors.DataHoverSensor()]}
        style={{ width: 600, height: 400 }}
        type="line"
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Chart.Series type="line" />
          <Probe />
        </Chart.Plot>
      </Chart>
    </DesignSystemProvider>,
  );
  await expect
    .poll(() => view.container.querySelectorAll("circle").length)
    .toBe(3);
  await userEvent.hover(view.container.querySelectorAll("circle")[1]);
  const hover = () =>
    createInteractionAccess(context.chartStore).getInteraction("primary-hover");
  const tooltip = () =>
    view.container.querySelector("[data-chart-tooltip]")?.textContent;
  await expect.poll(() => hover()?.targets[0]?.data).toEqual(data[1]);
  await expect.poll(tooltip).toContain("20");
  const reading = hover();
  for (const other of [
    { id: pointer.id + 1 },
    { source: InputSource.REMOTE },
    { userId: "remote" },
  ]) {
    act(() =>
      context.engine.input({
        ...pointer,
        ...other,
        action: InputAction.CANCEL,
      }),
    );
    expect(hover()).toBe(reading);
    expect(tooltip()).toContain("20");
  }
  act(() => context.engine.input({ ...pointer, action: InputAction.CANCEL }));
  await expect.poll(hover).toBeNull();
  await expect.poll(tooltip).toBeFalsy();
});
