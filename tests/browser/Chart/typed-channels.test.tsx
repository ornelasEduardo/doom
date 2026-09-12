import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import {
  type Behavior,
  Chart,
  createInteractionChannel,
  DesignSystemProvider,
  InputAction,
  type Sensor,
} from "../../../index";

afterEach(cleanup);

interface Row {
  category: string;
  value: number;
}
interface Brush {
  start: number;
  end: number;
  active: boolean;
}
const rows: Row[] = [
  { category: "A", value: 10 },
  { category: "B", value: 20 },
  { category: "C", value: 30 },
  { category: "D", value: 40 },
];

it("renders a custom brush and shares its channel across behaviors without raw store access", async () => {
  const brush = createInteractionChannel<Brush>("brush");
  const completed = createInteractionChannel<boolean>("completed");
  const updates: Array<{ active: boolean; complete: boolean | null }> = [];
  const sensor: Sensor<Row> = (event, context) => {
    if (event.signal.action === InputAction.START && event.isWithinPlot) {
      context.batchInteractions((batch) => {
        batch.upsertInteraction(brush, {
          start: event.chartX,
          end: event.chartX,
          active: true,
        });
        batch.upsertInteraction(completed, false);
      });
    }
    const current = context.getInteraction(brush);
    if (!current?.active) {
      return;
    }
    if (event.signal.action === InputAction.MOVE) {
      context.upsertInteraction(brush, { ...current, end: event.chartX });
    }
    if (event.signal.action === InputAction.END) {
      context.batchInteractions((batch) => {
        batch.upsertInteraction(brush, {
          ...current,
          end: event.chartX,
          active: false,
        });
        batch.upsertInteraction(completed, true);
      });
    }
  };
  const paint: Behavior<Row> = (context) => {
    const rect = context
      .getChartContext()
      .g?.append("rect")
      .attr("data-custom-brush", "")
      .attr("height", 20)
      .attr("fill", "var(--primary)")
      .attr("pointer-events", "none");
    const stop = context.subscribeInteraction(brush, (value) => {
      rect
        ?.attr("x", value ? Math.min(value.start, value.end) : 0)
        .attr("width", value ? Math.abs(value.end - value.start) : 0)
        .attr("data-active", String(value?.active ?? false));
    });
    return () => {
      stop();
      rect?.remove();
    };
  };
  const observe: Behavior<Row> = (context) =>
    context.subscribeInteraction(brush, (value) => {
      if (value) {
        updates.push({
          active: value.active,
          complete: context.getInteraction(completed),
        });
      }
    });
  const { container, unmount } = render(
    <DesignSystemProvider>
      <Chart
        behaviors={[paint, observe]}
        d3Config={{ showDots: true }}
        data={rows}
        sensors={[sensor]}
        style={{ width: 650, height: 400 }}
        x="category"
        y="value"
      />
    </DesignSystemProvider>,
  );
  const dots = () => container.querySelectorAll(".chart-line-series circle");
  await expect.poll(() => dots().length).toBe(4);
  await userEvent.dragAndDrop(dots()[1], dots()[2]);
  const rect = () => container.querySelector("[data-custom-brush]");
  await expect
    .poll(() => Number(rect()?.getAttribute("width")))
    .toBeGreaterThan(100);
  await expect.poll(() => rect()?.getAttribute("data-active")).toBe("false");
  expect(updates[0]).toEqual({ active: true, complete: false });
  expect(updates.at(-1)).toEqual({ active: false, complete: true });
  unmount();
  expect(container.querySelector("[data-custom-brush]")).toBeNull();
});

it("connects a typed hover channel to built-in sensor, tooltip, cursor and markers", async () => {
  const hover =
    createInteractionChannel<import("../../../index").HoverInteraction<Row>>(
      "custom-hover",
    );
  const { container } = render(
    <DesignSystemProvider>
      <Chart
        behaviors={[
          Chart.behaviors.Tooltip({
            on: hover,
            render: ({ data }) => data.map((row) => row.category).join(","),
          }),
          Chart.behaviors.Cursor({ on: hover }),
          Chart.behaviors.Markers({ on: hover }),
        ]}
        d3Config={{ showDots: true }}
        data={rows}
        sensors={[Chart.sensors.DataHoverSensor({ name: hover })]}
        style={{ width: 650, height: 400 }}
        x="category"
        y="value"
      />
    </DesignSystemProvider>,
  );
  const dots = () => container.querySelectorAll(".chart-line-series circle");
  await expect.poll(() => dots().length).toBe(4);
  await userEvent.hover(dots()[1]);
  await expect
    .poll(() => container.querySelector("[data-chart-tooltip]")?.textContent)
    .toBe("B");
  await expect
    .poll(
      () => container.querySelectorAll(".chart-markers-layer circle").length,
    )
    .toBe(1);
  await expect
    .poll(() => container.querySelectorAll("[data-chart-cursor]").length)
    .toBeGreaterThan(0);
});

it("refreshes a typed managed hover during streaming and clears it when its line series is removed", async () => {
  const hover =
    createInteractionChannel<import("../../../index").HoverInteraction<Row>>(
      "streaming-hover",
    );
  const sensors = [Chart.sensors.DataHoverSensor({ name: hover })];
  const behaviors = [
    Chart.behaviors.Tooltip({
      on: hover,
      render: ({ data }) => `${data[0]?.category}:${data[0]?.value}`,
    }),
  ];
  const fixture = (data: Row[], visible = true) => (
    <DesignSystemProvider>
      <Chart.Root
        behaviors={behaviors}
        d3Config={{ showDots: true }}
        data={data}
        sensors={sensors}
        style={{ width: 650, height: 400 }}
        x="category"
        y="value"
        yDomain={[0, 100]}
      >
        <Chart.Plot>{visible && <Chart.Series type="line" />}</Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>
  );
  const { container, rerender } = render(fixture(rows));
  const dots = () => container.querySelectorAll(".chart-line-series circle");
  await expect.poll(() => dots().length).toBe(4);
  await userEvent.hover(dots()[1]);
  const tooltip = () =>
    container.querySelector("[data-chart-tooltip]")?.textContent;
  await expect.poll(tooltip).toBe("B:20");
  const updated = rows.map((row) => ({ ...row, value: row.value * 2 }));
  rerender(fixture(updated));
  await expect.poll(tooltip).toBe("B:40");
  rerender(fixture(updated, false));
  await expect.poll(tooltip).toBeUndefined();
});

it("refreshes a stationary typed hover from custom geometry without Cartesian reprojection", async () => {
  const hover =
    createInteractionChannel<import("../../../index").HoverInteraction<Row>>(
      "custom-streaming",
    );
  let current: import("../../../index").HoverInteraction<Row> | null = null;
  const sensors = [Chart.sensors.DataHoverSensor({ name: hover })];
  const observe: Behavior<Row> = (context) =>
    context.subscribeInteraction(hover, (value) => {
      current = value;
    });
  const renderer = (frame: import("../../../index").RenderFrame<Row>) => {
    frame.container
      .selectAll<SVGCircleElement, Row>("circle.custom-dot")
      .data(frame.data)
      .join("circle")
      .attr("class", "custom-dot")
      .attr("cx", (_, index) => 100 + index * 100)
      .attr("cy", (datum) => 70 + datum.value)
      .attr("r", 8)
      .attr("fill", "var(--primary)");
    frame.geometry.update(
      frame.data.map((data, dataIndex) => ({
        data,
        dataIndex,
        x: 100 + dataIndex * 100,
        y: 70 + data.value,
      })),
    );
  };
  const fixture = (data: Row[]) => (
    <DesignSystemProvider>
      <Chart
        behaviors={[observe]}
        data={data}
        render={renderer}
        sensors={sensors}
        style={{ width: 650, height: 400 }}
        x="category"
        y="value"
      />
    </DesignSystemProvider>
  );
  const { container, rerender } = render(fixture(rows));
  const dots = () => container.querySelectorAll("circle.custom-dot");
  await expect.poll(() => dots().length).toBe(4);
  await userEvent.hover(dots()[1]);
  await expect.poll(() => current?.targets[0].data.value).toBe(20);
  const updated = rows.map((row) => ({ ...row, value: row.value + 30 }));
  rerender(fixture(updated));
  await expect.poll(() => current?.targets[0].data.value).toBe(50);
  const expectedY = () => {
    const dot = dots()[1].getBoundingClientRect();
    const svg = container.querySelector("svg")!.getBoundingClientRect();
    return dot.top + dot.height / 2 - svg.top;
  };
  await expect
    .poll(() =>
      Math.abs((current?.targets[0].coordinate.y ?? Infinity) - expectedY()),
    )
    .toBeLessThan(1);
});
