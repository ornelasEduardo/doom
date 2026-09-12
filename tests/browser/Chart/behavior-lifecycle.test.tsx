import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import {
  type Behavior,
  Chart,
  type Sensor,
} from "../../../components/Chart/Chart";
import type { SeriesProps } from "../../../components/Chart/types";
import type { HoverInteraction } from "../../../components/Chart/types/interaction";
import { createInteractionChannel } from "../../../components/Chart/utils/interactionChannels";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);
const rows = [
  { x: 0, y: 10 },
  { x: 1, y: 20 },
];
type Row = (typeof rows)[number];

it("keeps a custom brush overlay and its closure while siblings and series change", async () => {
  let mounts = 0;
  let cleanups = 0;
  const brush: Behavior<Row> = ({ getChartContext }) => {
    mounts++;
    const layer = getChartContext()
      .g!.append("rect")
      .attr("data-brush", "")
      .attr("x", 20)
      .attr("y", 20)
      .attr("width", 80)
      .attr("height", 50);
    return () => {
      cleanups++;
      layer.remove();
    };
  };
  const sibling: Behavior<Row> = ({ getChartContext }) => {
    const layer = getChartContext().g!.append("g").attr("data-sibling", "");
    return () => {
      layer.remove();
    };
  };
  const tree = (behaviors: Behavior<Row>[], extra = false) => (
    <StrictMode>
      <DesignSystemProvider>
        <Chart.Root
          behaviors={behaviors}
          data={rows}
          style={{ width: 650, height: 400 }}
          type="line"
          x="x"
          y="y"
        >
          <Chart.Plot>
            <Chart.Series type="line" />
            {extra && <Chart.Series label="Extra" type="line" />}
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>
    </StrictMode>
  );
  const view = render(tree([brush]));
  await expect
    .poll(() => view.container.querySelector("[data-brush]"))
    .not.toBeNull();
  const original = view.container.querySelector("[data-brush]");
  const baselineMounts = mounts;
  view.rerender(tree([brush, sibling]));
  await expect
    .poll(() => view.container.querySelector("[data-sibling]"))
    .not.toBeNull();
  expect(view.container.querySelector("[data-brush]")).toBe(original);
  view.rerender(tree([sibling, brush], true));
  await expect
    .poll(() => view.container.querySelectorAll(".chart-line-series").length)
    .toBe(2);
  expect(view.container.querySelector("[data-brush]")).toBe(original);
  view.rerender(tree([brush]));
  await expect
    .poll(() => view.container.querySelector("[data-sibling]"))
    .toBeNull();
  expect(view.container.querySelector("[data-brush]")).toBe(original);
  expect(mounts).toBe(baselineMounts);
  view.unmount();
  expect(cleanups).toBe(mounts);
});

it("clears a custom renderer's joined marks when data becomes empty", async () => {
  const draw: NonNullable<SeriesProps<Row>["render"]> = ({
    container,
    data,
  }) => {
    container
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("data-custom-mark", "")
      .attr("cx", 40)
      .attr("cy", 40)
      .attr("r", 6);
  };
  const tree = (data: Row[]) => (
    <DesignSystemProvider>
      <Chart
        data={data}
        render={draw}
        style={{ width: 650, height: 400 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const view = render(tree(rows));
  await expect
    .poll(() => view.container.querySelectorAll("[data-custom-mark]").length)
    .toBe(2);
  view.rerender(tree([]));
  await expect
    .poll(() => view.container.querySelectorAll("[data-custom-mark]").length)
    .toBe(0);
});

it("shows independent remote and pinned cursors and tooltips across add/remove", async () => {
  const pinnedChannel =
    createInteractionChannel<HoverInteraction<Row>>("pinned");
  const remoteChannel =
    createInteractionChannel<HoverInteraction<Row>>("remote");
  const seed: Sensor<Row> = (_, { upsertInteraction }) => {
    for (const [name, x] of [
      [pinnedChannel, 100],
      [remoteChannel, 200],
    ] as const) {
      upsertInteraction(name, {
        targets: [{ data: rows[0], coordinate: { x, y: 100 } }],
        pointer: { x, y: 100, containerX: x, containerY: 100, isTouch: false },
      });
    }
  };
  const pinned = [
    Chart.behaviors.Markers({ on: pinnedChannel }),
    Chart.behaviors.Cursor({ on: pinnedChannel }),
    Chart.behaviors.Tooltip<Row>({
      on: pinnedChannel,
      render: ({ data }) => `pinned:${data.length}`,
    }),
  ];
  const remote = [
    Chart.behaviors.Markers({ on: remoteChannel }),
    Chart.behaviors.Cursor({ on: remoteChannel }),
    Chart.behaviors.Tooltip<Row>({
      on: remoteChannel,
      render: ({ data }) => `remote:${data.length}`,
    }),
  ];
  const tree = (behaviors: Behavior<Row>[]) => (
    <DesignSystemProvider>
      <Chart
        behaviors={behaviors}
        d3Config={{ showDots: true }}
        data={rows}
        sensors={[seed]}
        style={{ width: 650, height: 400 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const view = render(tree([...pinned]));
  await expect
    .poll(() => view.container.querySelector("circle"))
    .not.toBeNull();
  await userEvent.hover(view.container.querySelector("circle")!);
  await expect
    .poll(() => view.container.querySelectorAll("[data-chart-tooltip]").length)
    .toBe(1);
  const pinnedNode = view.container.querySelector("[data-chart-tooltip]");
  view.rerender(tree([...pinned, ...remote]));
  await expect
    .poll(() => view.container.querySelectorAll("[data-chart-tooltip]").length)
    .toBe(2);
  expect(
    view.container.querySelectorAll("line[data-chart-cursor]"),
  ).toHaveLength(2);
  expect(
    view.container.querySelectorAll(".chart-markers-layer circle"),
  ).toHaveLength(2);
  expect(view.container.textContent).toContain("remote:1");
  expect(view.container.textContent).toContain("pinned:1");
  view.rerender(tree([...remote, ...pinned]));
  expect(
    Array.from(view.container.querySelectorAll("[data-chart-tooltip]")).find(
      (el) => el.textContent === "pinned:1",
    ),
  ).toBe(pinnedNode);
  view.rerender(tree([...pinned]));
  await expect
    .poll(() => view.container.querySelectorAll("[data-chart-tooltip]").length)
    .toBe(1);
  expect(
    view.container.querySelectorAll("line[data-chart-cursor]"),
  ).toHaveLength(1);
  expect(
    view.container.querySelectorAll(".chart-markers-layer circle"),
  ).toHaveLength(1);
  expect(view.container.querySelector("[data-chart-tooltip]")).toBe(pinnedNode);
});

it("hydrates an added selection behavior from the existing selected snapshot", async () => {
  const seed: Behavior<Row> = ({ upsertInteraction }) => {
    upsertInteraction("selection", { selection: [rows[0]], mode: "discrete" });
  };
  const selection = Chart.behaviors.SelectionUpdate<Row>({
    selector: "circle",
  });
  const tree = (behaviors: Behavior<Row>[]) => (
    <DesignSystemProvider>
      <Chart
        behaviors={behaviors}
        d3Config={{ showDots: true }}
        data={rows}
        style={{ width: 650, height: 400 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const view = render(tree([seed]));
  await expect
    .poll(() => view.container.querySelectorAll("circle").length)
    .toBe(2);
  view.rerender(tree([seed, selection]));
  await expect
    .poll(() => view.container.querySelectorAll("circle.selected").length)
    .toBe(1);
  expect(view.container.querySelectorAll("circle.dimmed")).toHaveLength(1);
  view.rerender(tree([seed]));
  expect(
    view.container.querySelectorAll("circle.selected, circle.dimmed"),
  ).toHaveLength(0);
});

it("keeps selection usable after a behavior fails hydration and is removed", async () => {
  const report = vi.spyOn(console, "error").mockImplementation(() => {});
  const failure = new Error("selection hydration failed");
  let attempts = 0;
  const broken = Chart.behaviors.SelectionUpdate<Row>({
    selector: "circle",
    fn: (selection) => {
      attempts++;
      if (attempts === 1) {
        throw failure;
      }
      selection.attr("data-leaked-update", "true");
    },
  });
  const healthy = Chart.behaviors.SelectionUpdate<Row>({
    selector: "circle",
    fn: (selection, data) => {
      selection.attr("data-selected-count", data.length);
    },
  });
  const sensors = [Chart.sensors.SelectionSensor()];
  const tree = (behaviors: Behavior<Row>[]) => (
    <DesignSystemProvider>
      <Chart
        behaviors={behaviors}
        d3Config={{ showDots: true }}
        data={rows}
        sensors={sensors}
        style={{ width: 650, height: 400 }}
        type="line"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const view = render(tree([healthy]));
  try {
    await expect
      .poll(() => view.container.querySelectorAll("circle").length)
      .toBe(2);
    view.rerender(tree([healthy, broken]));
    await expect.poll(() => attempts).toBe(1);
    expect(report).toHaveBeenCalledWith("Chart behavior setup failed", failure);
    view.rerender(tree([healthy]));
    const circle = view.container.querySelector("circle")!;
    await userEvent.click(circle);
    await expect
      .poll(() => circle.getAttribute("data-selected-count"))
      .toBe("1");
    expect(circle.hasAttribute("data-leaked-update")).toBe(false);
    expect(attempts).toBe(1);
    await userEvent.click(circle);
    await expect
      .poll(() => circle.getAttribute("data-selected-count"))
      .toBe("0");
    view.unmount();
    expect(attempts).toBe(1);
  } finally {
    view.unmount();
    report.mockRestore();
  }
});
