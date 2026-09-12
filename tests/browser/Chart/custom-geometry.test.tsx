import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import type { EngineEvent } from "../../../components/Chart/engine";
import type { Store } from "../../../components/Chart/state/store/chart.store";
import type {
  ContextValue,
  RenderFrame,
} from "../../../components/Chart/types/context";
import type { GenericSensor } from "../../../components/Chart/types/events";
import type { HoverInteraction } from "../../../components/Chart/types/interaction";
import type { CustomGeometry } from "../../../components/Chart/utils/customGeometry";
import {
  createInteractionAccess,
  createInteractionChannel,
} from "../../../components/Chart/utils/interactionChannels";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

interface Row {
  x: number;
  y: number;
  label: string;
}
const initial = [
  { x: 0, y: 1, label: "root" },
  { x: 1, y: 2, label: "root-end" },
];
afterEach(() => {
  cleanup();
  window.scrollTo(0, 0);
});

it("keeps transformed custom handles in SVG space across header, scale, scroll, owners and root updates", async () => {
  const frames = new Map<string, RenderFrame<Row>>();
  const events = new Map<string, EngineEvent>();
  const selected = new Map<string, unknown>();
  const renders = new Map<string, (frame: RenderFrame<Row>) => void>();
  const sensors = new Map<string, GenericSensor[]>();
  for (const id of ["left", "right"]) {
    renders.set(id, (frame) => {
      frames.set(id, frame);
      const annotation = frame.container
        .selectAll<SVGGElement, Row>("g.annotation")
        .data([frame.data[0]])
        .join("g")
        .attr("class", "annotation")
        .attr("transform", "translate(100,70) scale(1.5)");
      annotation
        .selectAll("circle")
        .data([frame.data[0]])
        .join("circle")
        .attr("cx", 20)
        .attr("cy", 10)
        .attr("r", 8)
        .attr("fill", "var(--primary)")
        .attr(frame.chartDataAttrs.TYPE, "data-point")
        .attr(frame.chartDataAttrs.SERIES_ID, frame.seriesId)
        .attr(frame.chartDataAttrs.INDEX, 0);
      frame.geometry.update([
        {
          x: 20,
          y: 10,
          data: frame.data[0],
          dataIndex: 0,
          element: annotation.node()!,
        },
      ]);
    });
    sensors.set(id, [
      Chart.sensors.DataHoverSensor({ name: "exact", hitPolicy: "exact" }),
      Chart.sensors.DataHoverSensor({ name: "nearest", hitPolicy: "nearest" }),
      (event, context) => {
        events.set(id, event);
        selected.set(id + "-exact", context.getInteraction("exact"));
        selected.set(id + "-nearest", context.getInteraction("nearest"));
      },
    ]);
  }
  const fixture = (data: Row[], showLeft = true) => (
    <DesignSystemProvider>
      <div style={{ height: 200 }} />
      <div
        style={{
          display: "flex",
          transform: "scale(0.8)",
          transformOrigin: "top left",
        }}
      >
        {["left", "right"].map((id) => (
          <Chart.Root
            key={id}
            data={data}
            sensors={sensors.get(id)}
            style={{ width: 520, height: 380, flexShrink: 0 }}
            x="x"
            y="y"
          >
            <Chart.Header>
              <div style={{ height: 80 }}>Header {id}</div>
            </Chart.Header>
            <Chart.Plot>
              <Chart.Series label="Root" type="line" />
              {(id !== "left" || showLeft) && (
                <Chart.Series label="Annotation" render={renders.get(id)} />
              )}
            </Chart.Plot>
          </Chart.Root>
        ))}
      </div>
      <div style={{ height: 1500 }} />
    </DesignSystemProvider>
  );
  const result = render(fixture(initial));
  await expect.poll(() => frames.get("left")?.geometry).toBeDefined();
  const owner = frames.get("left")!.geometry as CustomGeometry<Row>;
  const roots = result.container.querySelectorAll<HTMLElement>(
    "[data-chart-container]",
  );
  window.scrollTo(0, 140);
  const hover = async (id: string, dx = 0) => {
    const root = roots[id === "left" ? 0 : 1];
    const circle = root.querySelector("g.annotation circle")!;
    const rect = circle.getBoundingClientRect();
    const svg = root.querySelector("svg")!;
    const svgRect = svg.getBoundingClientRect();
    await userEvent.hover(svg, {
      position: {
        x: rect.left + rect.width / 2 + dx - svgRect.left,
        y: rect.top + rect.height / 2 - svgRect.top,
      },
    });
    await expect.poll(() => events.get(id)?.signal.x).toBeDefined();
    return { root, circle };
  };
  const { root, circle } = await hover("left");
  await expect
    .poll(() =>
      events.get("left")?.candidates.some((c) => c.element === circle),
    )
    .toBe(true);
  const svg = root.querySelector("svg")!;
  const rect = circle.getBoundingClientRect();
  const expected = new DOMPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
  ).matrixTransform(svg.getScreenCTM()!.inverse());
  const candidates = events
    .get("left")!
    .candidates.filter((c) => c.seriesId === frames.get("left")!.seriesId);
  expect(candidates.length).toBeGreaterThanOrEqual(2);
  for (const candidate of candidates) {
    expect(candidate.coordinate.x).toBeCloseTo(expected.x, 3);
    expect(candidate.coordinate.y).toBeCloseTo(expected.y, 3);
    expect(candidate.distance).toBeLessThan(2);
  }
  await hover("left", 20);
  await expect.poll(() => selected.get("left-exact")).toBeNull();
  expect(selected.get("left-nearest")).not.toBeNull();
  await hover("right");
  await expect.poll(() => selected.get("right-exact")).not.toBeNull();
  expect(
    events
      .get("right")!
      .candidates.every((c) => c.seriesId !== frames.get("left")!.seriesId),
  ).toBe(true);

  const updated = initial.map((row) => ({
    ...row,
    y: row.y + 1,
    label: "updated",
  }));
  result.rerender(fixture(updated));
  await expect.poll(() => frames.get("left")?.data[0].label).toBe("updated");
  expect(frames.get("left")!.geometry).toBe(owner);
  await hover("left");
  await expect
    .poll(() =>
      events
        .get("left")
        ?.candidates.some(
          (c) =>
            !c.element &&
            c.seriesId === frames.get("left")!.seriesId &&
            (c.data as Row).label === "updated",
        ),
    )
    .toBe(true);
  const disposedSeries = frames.get("left")!.seriesId;
  const oldRect = circle.getBoundingClientRect();
  result.rerender(fixture(updated, false));
  owner.update([
    { x: expected.x, y: expected.y, data: updated[0], dataIndex: 0 },
  ]);
  const svgRect = svg.getBoundingClientRect();
  await userEvent.hover(svg, {
    position: {
      x: oldRect.left + oldRect.width / 2 + 1 - svgRect.left,
      y: oldRect.top + oldRect.height / 2 - svgRect.top,
    },
  });
  await expect
    .poll(() =>
      events.get("left")?.candidates.some((c) => c.seriesId === disposedSeries),
    )
    .toBe(false);
  await hover("right");
  await expect.poll(() => selected.get("right-exact")).not.toBeNull();
});

it("resolves the full chosen slice when nearest selects a different target from the topmost DOM hit", async () => {
  const interactions = new Map<
    string,
    | import("../../../components/Chart/types/interaction").HoverInteraction
    | null
  >();
  let latest: EngineEvent | undefined;
  const draw =
    (x: number, y: number, label: string, rect = false) =>
    (frame: RenderFrame<Row>) => {
      const datum = { x, y, label };
      if (rect) {
        frame.container
          .selectAll("rect")
          .data([datum])
          .join("rect")
          .attr("x", x - 40)
          .attr("y", y - 20)
          .attr("width", 80)
          .attr("height", 40)
          .attr("fill", "var(--primary)")
          .attr("data-test-annotation", "slice")
          .attr(frame.chartDataAttrs.TYPE, "data-point")
          .attr(frame.chartDataAttrs.SERIES_ID, frame.seriesId)
          .attr(frame.chartDataAttrs.INDEX, 0);
      }
      frame.geometry.update([{ x, y, data: datum, dataIndex: 0 }]);
    };
  const observe: GenericSensor = (event, context) => {
    latest = event;
    for (const name of ["exact", "nearest"]) {
      interactions.set(
        name,
        context.getInteraction(name) as
          | import("../../../components/Chart/types/interaction").HoverInteraction
          | null,
      );
    }
  };
  const result = render(
    <DesignSystemProvider>
      <Chart.Root
        data={initial}
        sensors={[
          Chart.sensors.DataHoverSensor({
            name: "exact",
            hitPolicy: "exact",
            verticalSlice: true,
          }),
          Chart.sensors.DataHoverSensor({
            name: "nearest",
            hitPolicy: "nearest",
            verticalSlice: true,
          }),
          observe,
        ]}
        style={{ width: 600, height: 400 }}
        x="x"
        y="y"
      >
        <Chart.Header>
          <div style={{ height: 80 }}>Slice stress</div>
        </Chart.Header>
        <Chart.Plot>
          <Chart.Series label="Area" render={draw(100, 70, "area", true)} />
          <Chart.Series
            label="Area peer"
            render={draw(100, 100, "area-peer")}
          />
          <Chart.Series label="Near" render={draw(125, 70, "near")} />
          <Chart.Series
            label="Near peer"
            render={draw(125, 100, "near-peer")}
          />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>,
  );
  await expect
    .poll(() => result.container.querySelector("[data-test-annotation]"))
    .not.toBeNull();
  const rect = result.container.querySelector("[data-test-annotation]")!;
  const box = rect.getBoundingClientRect();
  await userEvent.hover(rect, {
    position: { x: box.width / 2 + 25, y: box.height / 2 },
  });
  await expect
    .poll(() =>
      interactions
        .get("nearest")
        ?.targets.map((target) => (target.data as Row).label)
        .sort(),
    )
    .toEqual(["near", "near-peer"]);
  expect((latest!.primaryCandidate!.data as Row).label).toBe("area");
  expect(
    interactions
      .get("exact")!
      .targets.map((target) => (target.data as Row).label)
      .sort(),
  ).toEqual(["area", "area-peer"]);
});

it.each([false, true])(
  "refreshes stationary transformed custom targets through updates and removal (typed channel: %s)",
  async (typed) => {
    let frame!: RenderFrame<Row>;
    let store!: Store<Row>;
    const channel =
      createInteractionChannel<HoverInteraction<Row>>("stationary");
    function Probe() {
      store = useChartContext<Row>().chartStore;
      return null;
    }
    const draw = (next: RenderFrame<Row>) => {
      frame = next;
      next.container.attr("transform", "translate(25,15) scale(1.5)");
      next.container
        .selectAll("circle")
        .data([next.data[0]])
        .join("circle")
        .attr("cx", 100)
        .attr("cy", 70)
        .attr("r", 8)
        .attr("data-stationary-handle", "true")
        .attr(next.chartDataAttrs.TYPE, "data-point")
        .attr(next.chartDataAttrs.SERIES_ID, next.seriesId)
        .attr(next.chartDataAttrs.INDEX, 0);
      next.geometry.update([
        { x: 100, y: 70, data: next.data[0], dataIndex: 0 },
      ]);
    };
    const sensor = typed
      ? Chart.sensors.DataHoverSensor({ name: channel })
      : Chart.sensors.DataHoverSensor();
    const markers = typed
      ? Chart.behaviors.Markers({ on: channel })
      : Chart.behaviors.Markers();
    const tree = (data: Row[], show = true) => (
      <DesignSystemProvider>
        <Chart.Root
          behaviors={[markers]}
          data={data}
          sensors={[sensor]}
          style={{ width: 600, height: 400 }}
          x="x"
          xDomain={[0, 100]}
          y="y"
          yDomain={[0, 100]}
        >
          <Chart.Header>
            <div style={{ height: 80 }}>Stationary custom</div>
          </Chart.Header>
          <Chart.Plot>
            {show && <Chart.Series label="Custom" render={draw} x="x" y="y" />}
            <Probe />
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>
    );
    const data = [
      { x: 10, y: 20, label: "initial" },
      { x: 90, y: 80, label: "end" },
    ];
    const view = render(tree(data));
    const hover = () =>
      typed
        ? createInteractionAccess(store).getInteraction(channel)
        : createInteractionAccess(store).getInteraction("primary-hover");
    const target = () => hover()?.targets[0];
    await expect
      .poll(() => view.container.querySelector("[data-stationary-handle]"))
      .not.toBeNull();
    const circle = view.container.querySelector<SVGCircleElement>(
      "[data-stationary-handle]",
    )!;
    await userEvent.hover(circle);
    await expect.poll(() => target()?.geometryOwner).toBeDefined();
    const owner = frame.geometry;
    const token = target()!.geometryOwner;
    const marker = () =>
      view.container.querySelector<SVGCircleElement>(
        ".chart-markers-layer circle",
      );
    const checkPosition = async () => {
      const box = circle.getBoundingClientRect();
      const position = new DOMPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      ).matrixTransform(circle.ownerSVGElement!.getScreenCTM()!.inverse());
      await expect
        .poll(() => target()?.coordinate.x)
        .toBeCloseTo(position.x, 3);
      await expect
        .poll(() => target()?.coordinate.y)
        .toBeCloseTo(position.y, 3);
      await expect
        .poll(() => Number(marker()?.getAttribute("cx")))
        .toBeCloseTo(position.x - store.getState().dimensions.margin.left, 3);
    };
    await checkPosition();
    circle.setAttribute("cx", "140");
    circle.setAttribute("cy", "90");
    const moved = { x: 66, y: 55, label: "moved" };
    frame.geometry.update([{ x: 140, y: 90, data: moved, dataIndex: 0 }]);
    await checkPosition();
    expect(target()!.data).toEqual(moved);
    const streamed = data.map((row) => ({
      ...row,
      y: row.y + 2,
      label: "streamed",
    }));
    view.rerender(tree(streamed));
    await expect.poll(() => target()?.data.label).toBe("streamed");
    expect(frame.geometry).toBe(owner);
    expect(target()!.geometryOwner).toBe(token);
    await checkPosition();
    view.rerender(tree(streamed, false));
    await expect.poll(hover).toBeNull();
    await expect.poll(marker).toBeNull();
  },
);

it.each([false, true])(
  "refreshes and clears a stationary standalone owner (overrides root identity: %s)",
  async (overrideRoot) => {
    let context!: ContextValue<Row>;
    function Probe() {
      context = useChartContext<Row>();
      return null;
    }
    const channel =
      createInteractionChannel<HoverInteraction<Row>>("standalone");
    const sensor = Chart.sensors.DataHoverSensor({
      name: channel,
      hitPolicy: "nearest",
    });
    const markers = Chart.behaviors.Markers({ on: channel });
    const data = [
      { x: 10, y: 20, label: "root" },
      { x: 90, y: 80, label: "end" },
    ];
    const tree = (rows: Row[]) => (
      <DesignSystemProvider>
        <Chart.Root
          behaviors={[markers]}
          data={rows}
          sensors={[sensor]}
          style={{ width: 600, height: 400 }}
          x="x"
          xDomain={[0, 100]}
          y="y"
          yDomain={[0, 100]}
        >
          <Chart.Plot>
            <Chart.Series label="Root" type="line" />
            <Probe />
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>
    );
    const view = render(tree(data));
    await expect
      .poll(() => context?.chartStore.getState().processedSeries.length)
      .toBe(1);
    const rootSeries = context.chartStore.getState().processedSeries[0].id;
    const seriesId = overrideRoot ? rootSeries : "standalone-owner";
    const ownedDatum = { x: 35, y: 65, label: "owner" };
    const owner = context.engine.registerGeometry([
      { x: 200, y: 100, data: ownedDatum, seriesId, dataIndex: 0 },
    ]);
    const access = createInteractionAccess(context.chartStore);
    const hover = () => access.getInteraction(channel);
    const svg = view.container.querySelector("svg")!;
    await userEvent.hover(svg, { position: { x: 200, y: 100 } });
    await expect.poll(() => hover()?.targets[0].data.label).toBe("owner");
    const token = hover()!.targets[0].geometryOwner;
    expect(token).toBeDefined();
    view.rerender(tree(data.map((row) => ({ ...row, y: row.y + 3 }))));
    await expect.poll(() => context.chartStore.getState().data[0].y).toBe(23);
    expect(hover()!.targets[0]).toMatchObject({
      data: ownedDatum,
      coordinate: { x: 200, y: 100 },
      geometryOwner: token,
    });
    owner.update([
      {
        x: 240,
        y: 140,
        data: { ...ownedDatum, label: "moved" },
        seriesId,
        dataIndex: 0,
      },
    ]);
    await expect
      .poll(() => hover()?.targets[0].coordinate)
      .toEqual({ x: 240, y: 140 });
    expect(hover()!.targets[0].data.label).toBe("moved");
    await expect
      .poll(() =>
        Number(
          view.container
            .querySelector(".chart-markers-layer circle")
            ?.getAttribute("cx"),
        ),
      )
      .toBe(240 - context.chartStore.getState().dimensions.margin.left);
    const selected = hover()!.targets[0];
    owner.dispose();
    await expect.poll(hover).toBeNull();
    expect(context.engine.resolveTarget(selected)).toBeNull();
    expect(
      context.engine.resolveTarget({ seriesId: rootSeries, dataIndex: 0 }),
    ).toBeUndefined();
    await expect
      .poll(() => view.container.querySelector(".chart-markers-layer circle"))
      .toBeNull();
  },
);
