import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { Chart } from "../../../components/Chart/Chart";
import type { SeriesProps } from "../../../components/Chart/types";
import type {
  Behavior,
  BehaviorContext,
} from "../../../components/Chart/types/events";
import type { HoverInteraction } from "../../../components/Chart/types/interaction";
import { createInteractionChannel } from "../../../components/Chart/utils/interactionChannels";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

const rows = [
  { x: 0, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 3 },
];
type Row = (typeof rows)[number];
afterEach(cleanup);

it("reconciles an external style edit through overlapping owners with different active points", async () => {
  let context: BehaviorContext<Row> | undefined;
  const capture: Behavior<Row> = (value) => {
    context = value;
  };
  const first = createInteractionChannel<HoverInteraction<Row>>("first");
  const second = createInteractionChannel<HoverInteraction<Row>>("second");
  const effects = [
    Chart.behaviors.Dim({
      on: first,
      selector: ".chart-scatter-series circle",
      opacity: 0.3,
    }),
    Chart.behaviors.Dim({
      on: second,
      selector: ".chart-scatter-series circle",
      opacity: 0.6,
    }),
  ];
  const tree = (enabled: boolean) => (
    <DesignSystemProvider>
      <Chart
        behaviors={[capture, ...(enabled ? effects : [])]}
        data={rows}
        style={{ width: 650, height: 400 }}
        type="scatter"
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const view = render(tree(true));
  const marks = view.container.querySelectorAll<SVGCircleElement>(
    ".chart-scatter-series circle",
  );
  await expect.poll(() => context).toBeDefined();
  const reading = (index: number): HoverInteraction<Row> => ({
    pointer: { x: 0, y: 0, containerX: 0, containerY: 0, isTouch: false },
    targets: [
      { data: rows[index], dataIndex: index, coordinate: { x: 0, y: 0 } },
    ],
  });
  context!.batchInteractions((writer) => {
    writer.upsertInteraction(first, reading(0));
    writer.upsertInteraction(second, reading(1));
  });
  await expect.poll(() => marks[0].style.opacity).toBe("0.6");
  marks[0].style.setProperty("opacity", "0.7", "important");
  await expect.poll(() => getComputedStyle(marks[0]).opacity).toBe("0.6");
  view.rerender(tree(false));
  await expect.poll(() => getComputedStyle(marks[0]).opacity).toBe("0.7");
  expect(marks[0].style.getPropertyPriority("opacity")).toBe("important");
});

it("dims hydrated custom marks, follows renderer rebinding and restores consumer styles", async () => {
  let context: BehaviorContext<Row> | undefined;
  const capture: Behavior<Row> = (value) => {
    context = value;
  };
  const channel =
    createInteractionChannel<HoverInteraction<Row>>("custom-focus");
  const dim: Behavior<Row> = Chart.behaviors.Dim({
    on: channel,
    selector: "[data-dim-mark]",
  });
  const draw: NonNullable<SeriesProps<Row>["render"]> = ({
    container,
    data,
  }) => {
    container
      .selectAll<SVGCircleElement, Row>("circle")
      .data(data)
      .join("circle")
      .attr("data-dim-mark", "")
      .attr("cx", (d) => 30 + d.x * 30)
      .attr("cy", 30)
      .attr("r", 8)
      .attr("opacity", "0.8");
  };
  const tree = (data: Row[], enabled = true) => (
    <DesignSystemProvider>
      <Chart
        behaviors={enabled ? [capture, dim] : [capture]}
        data={data}
        render={draw}
        style={{ width: 650, height: 400 }}
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const view = render(tree(rows, false));
  await expect
    .poll(() => view.container.querySelectorAll("[data-dim-mark]").length)
    .toBe(3);
  const hover = (data: Row, dataIndex: number) =>
    context!.upsertInteraction(channel, {
      pointer: { x: 30, y: 30, containerX: 30, containerY: 30, isTouch: false },
      targets: [
        { data, dataIndex, seriesId: "custom", coordinate: { x: 30, y: 30 } },
      ],
    });
  hover(rows[0], 0);
  view.rerender(tree(rows));
  const marks = () =>
    Array.from(
      view.container.querySelectorAll<SVGCircleElement>("[data-dim-mark]"),
    );
  await expect.poll(() => getComputedStyle(marks()[1]).opacity).toBe("0.3");
  expect(getComputedStyle(marks()[0]).opacity).toBe("0.8");
  marks()[1].style.setProperty("opacity", "0.6", "important");
  await expect.poll(() => getComputedStyle(marks()[1]).opacity).toBe("0.3");
  hover(rows[1], 1);
  await expect.poll(() => getComputedStyle(marks()[1]).opacity).toBe("0.6");
  const replacement = rows.map((row) => ({ ...row, y: row.y + 10 }));
  view.rerender(tree(replacement));
  hover(replacement[2], 2);
  await expect.poll(() => getComputedStyle(marks()[2]).opacity).toBe("0.8");
  expect(getComputedStyle(marks()[0]).opacity).toBe("0.3");
  context!.removeInteraction(channel);
  await expect.poll(() => getComputedStyle(marks()[0]).opacity).toBe("0.8");
  hover(replacement[0], 0);
  view.rerender(tree(replacement, false));
  await expect.poll(() => marks()[1].style.opacity).toBe("0.6");
  expect(marks()[1].style.getPropertyPriority("opacity")).toBe("important");
  expect(marks()[2].style.opacity).toBe("");
});

it("reindexes a custom renderer that only rebinds data on existing nodes", async () => {
  let context: BehaviorContext<Row> | undefined;
  const capture: Behavior<Row> = (value) => {
    context = value;
  };
  const dim = Chart.behaviors.Dim({ selector: "[data-datum-only]" });
  const draw: NonNullable<SeriesProps<Row>["render"]> = ({
    container,
    data,
  }) => {
    container
      .selectAll<SVGCircleElement, Row>("circle")
      .data(data)
      .join((enter) =>
        enter
          .append("circle")
          .attr("data-datum-only", "")
          .attr("r", 5)
          .attr("cx", 30)
          .attr("cy", 30),
      );
  };
  const tree = (data: Row[]) => (
    <DesignSystemProvider>
      <Chart
        behaviors={[capture, dim]}
        data={data}
        render={draw}
        style={{ width: 650, height: 400 }}
        x="x"
        y="y"
      />
    </DesignSystemProvider>
  );
  const view = render(tree(rows));
  const marks = () =>
    Array.from(
      view.container.querySelectorAll<SVGCircleElement>("[data-datum-only]"),
    );
  await expect.poll(() => marks().length).toBe(3);
  context!.upsertInteraction("primary-hover", {
    pointer: { x: 30, y: 30, containerX: 30, containerY: 30, isTouch: false },
    targets: [{ data: rows[0], dataIndex: 0, coordinate: { x: 30, y: 30 } }],
  });
  expect(getComputedStyle(marks()[1]).opacity).toBe("0.3");
  view.rerender(tree([...rows].reverse()));
  await expect.poll(() => getComputedStyle(marks()[2]).opacity).toBe("1");
  expect(getComputedStyle(marks()[0]).opacity).toBe("0.3");
  expect(context!.getInteraction("primary-hover")?.targets[0].data).toBe(
    rows[0],
  );
});

it.each([false, true])(
  "restores overlapping Dim declarations in either detach order (reverse=%s)",
  async (reverse) => {
    let context: BehaviorContext<Row> | undefined;
    const capture: Behavior<Row> = (value) => {
      context = value;
    };
    const channel = createInteractionChannel<HoverInteraction<Row>>("overlap");
    const first = Chart.behaviors.Dim({
      on: channel,
      selector: ".chart-scatter-series circle",
      opacity: 0.3,
    });
    const second = Chart.behaviors.Dim({
      on: channel,
      selector: ".chart-scatter-series circle",
      opacity: 0.6,
    });
    const tree = (behaviors: Behavior<Row>[]) => (
      <DesignSystemProvider>
        <Chart
          behaviors={[capture, ...behaviors]}
          data={rows}
          style={{ width: 650, height: 400 }}
          type="scatter"
          x="x"
          y="y"
        />
      </DesignSystemProvider>
    );
    const view = render(tree([]));
    const marks = () =>
      Array.from(
        view.container.querySelectorAll<SVGCircleElement>(
          ".chart-scatter-series circle",
        ),
      );
    await expect.poll(() => marks().length).toBe(3);
    marks()[1].style.setProperty("opacity", "0.8", "important");
    context!.upsertInteraction(channel, {
      pointer: { x: 30, y: 30, containerX: 30, containerY: 30, isTouch: false },
      targets: [{ data: rows[0], dataIndex: 0, coordinate: { x: 30, y: 30 } }],
    });
    view.rerender(tree([first, second]));
    await expect.poll(() => getComputedStyle(marks()[1]).opacity).toBe("0.6");
    view.rerender(tree(reverse ? [first] : [second]));
    await expect
      .poll(() => getComputedStyle(marks()[1]).opacity)
      .toBe(reverse ? "0.3" : "0.6");
    view.rerender(tree([]));
    await expect.poll(() => getComputedStyle(marks()[1]).opacity).toBe("0.8");
    expect(marks()[1].style.getPropertyPriority("opacity")).toBe("important");
  },
);
