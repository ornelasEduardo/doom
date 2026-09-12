import { cleanup, render } from "@testing-library/react";
import { scaleLinear } from "d3-scale";
import { useRef } from "react";
import { afterEach, expect, it } from "vitest";

import { Tooltip as TooltipBehavior } from "../../behaviors";
import { ChartContext } from "../../context";
import { Engine } from "../../engine";
import { useChartBehaviors } from "../../hooks/useChartBehaviors";
import {
  createChartStore,
  upsertInteraction,
} from "../../state/store/chart.store";
import type { ContextValue } from "../../types/context";
import type { HoverInteraction } from "../../types/interaction";
import { Tooltip } from "./Tooltip";

afterEach(cleanup);

type Datum = { x: number; y: number; amount?: number };
const selected = (
  seriesId: string | undefined,
  y: number,
  amount?: number,
) => ({
  seriesId,
  data: { x: 35, y, amount },
  coordinate: { x: 100, y: 70 },
});

function mount(
  targets: HoverInteraction<Datum>["targets"],
  custom = false,
  bounded = false,
  customSeries = false,
) {
  const chartStore = createChartStore({ type: "line" });
  chartStore.setState({
    status: "ready",
    elements: {
      ...chartStore.getState().elements,
      plot: document.createElementNS("http://www.w3.org/2000/svg", "g"),
    },
    processedSeries: [
      {
        id: "known",
        type: customSeries ? "custom" : "line",
        label: "Known",
        color: "red",
        xAccessor: "x",
        yAccessor: "amount",
      },
      {
        id: "unselected",
        label: "Unselected",
        color: "currentColor",
        yAccessor: "y",
        data: [{ x: 35, y: 999 }],
      },
    ],
  });
  if (bounded) {
    chartStore.setState({
      xDomain: [0, 100],
      yDomain: [0, 100],
      scales: {
        ...chartStore.getState().scales,
        x: scaleLinear().domain([0, 100]).range([0, 180]),
        y: scaleLinear().domain([0, 100]).range([180, 0]),
      },
      dimensions: {
        width: 200,
        height: 200,
        innerWidth: 180,
        innerHeight: 180,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      },
    });
  }
  const context: ContextValue<Datum> = {
    chartStore,
    engine: new Engine<Datum>(),
    x: "x",
    y: (datum) => datum.y,
    config: {},
    isMobile: false,
    colorPalette: [],
    styles: {},
    resolveInteraction: () => null,
  };
  upsertInteraction(chartStore, "primary-hover", {
    targets,
    pointer: { x: 100, y: 70, containerX: 100, containerY: 70, isTouch: false },
  });
  const behavior = TooltipBehavior<Datum>({
    render: custom
      ? ({ data, targets }) => JSON.stringify({ data, targets })
      : undefined,
  });
  function Fixture() {
    const containerRef = useRef<HTMLDivElement>(null);
    useChartBehaviors(context, [behavior]);
    return (
      <ChartContext.Provider value={context}>
        <div ref={containerRef}>
          <Tooltip containerRef={containerRef} />
        </div>
      </ChartContext.Provider>
    );
  }
  const view = render(<Fixture />);
  return {
    ...view,
    engine: context.engine,
    text: view.container.querySelector("[data-chart-tooltip]")?.textContent,
  };
}

it.each([
  {
    name: "independent owner",
    targets: [selected("standalone-owner", 65)],
    want: "3565",
  },
  {
    name: "unidentified targets",
    targets: [selected(undefined, 65), selected(undefined, 75)],
    want: "356575",
  },
  {
    name: "mixed owners in selection order",
    targets: [
      selected("standalone-owner", 65),
      selected("known", 20, 42),
      selected(undefined, 75),
    ],
    want: "3565Known:4275",
  },
  {
    name: "multiple selected rows from one series",
    targets: [selected("known", 20, 42), selected("known", 30, 52)],
    want: "35Known:42Known:52",
  },
])("renders $name without adding unselected series", ({ targets, want }) => {
  const view = mount(targets);
  expect(view.text).toBe(want);
  view.unmount();
  view.engine.dispose();
});

it("preserves complete custom-render data and target payloads", () => {
  const targets = [
    selected("standalone-owner", 65),
    selected("known", 20, 42),
    selected(undefined, 75),
  ];
  const view = mount(targets, true);
  expect(JSON.parse(view.text!)).toEqual({
    data: targets.map((target) => target.data),
    targets,
  });
  view.unmount();
  view.engine.dispose();
});

it.each([false, true])(
  "uses owned geometry instead of reprojecting bounded tooltip data (owned=%s)",
  (owned) => {
    const view = mount(
      [
        {
          ...selected("known", 200, 200),
          geometryOwner: owned ? {} : undefined,
        },
      ],
      false,
      true,
    );
    expect(view.text).toBe(owned ? "35Known:200" : "35");
    view.unmount();
    view.engine.dispose();
  },
);

it("does not reproject a selected DOM-only custom series", () => {
  const view = mount([selected("known", 200, 200)], false, true, true);
  expect(view.text).toBe("35Known:200");
  view.unmount();
  view.engine.dispose();
});
