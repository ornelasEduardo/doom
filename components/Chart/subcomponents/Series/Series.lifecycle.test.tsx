import { act, cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, it } from "vitest";

import { ChartContext } from "../../context";
import { Engine } from "../../engine";
import {
  createChartStore,
  updateChartState,
} from "../../state/store/chart.store";
import type { ContextValue } from "../../types/context";
import { createInteractionAccess } from "../../utils/interactionChannels";
import { BarSeries } from "../BarSeries/BarSeries";
import { LineSeries } from "../LineSeries/LineSeries";
import { ScatterSeries } from "../ScatterSeries/ScatterSeries";

afterEach(cleanup);
const before = [
  { x: 0, y: 10 },
  { x: 1, y: 20 },
];
const after = [
  { x: 0, y: 11 },
  { x: 1, y: 21 },
];
type Row = (typeof before)[number];

it.each([LineSeries, BarSeries, ScatterSeries])(
  "retains managed hover through %s updates and clears it on actual unmount",
  (Component) => {
    const chartStore = createChartStore<Row>({}, "x", "y");
    updateChartState(chartStore, {
      data: before,
      dimensions: {
        width: 200,
        height: 200,
        innerWidth: 180,
        innerHeight: 180,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      },
    });
    const engine = new Engine<Row>();
    const context: ContextValue<Row> = {
      chartStore,
      engine,
      config: {},
      x: "x",
      y: "y",
      isMobile: false,
      colorPalette: [],
      styles: {},
      resolveInteraction: () => null,
    };
    const access = createInteractionAccess(chartStore);
    const tree = (data: Row[], label: string, mounted = true) => (
      <StrictMode>
        <ChartContext.Provider value={context}>
          <svg>{mounted && <Component data={data} label={label} />}</svg>
        </ChartContext.Provider>
      </StrictMode>
    );
    const view = render(tree(before, "Before"));
    const id = chartStore.getState().processedSeries[0].id;
    act(() =>
      access.upsertHoverInteraction("primary-hover", {
        targets: [
          {
            data: before[0],
            dataIndex: 0,
            seriesId: id,
            coordinate: { x: 10, y: 100 },
          },
        ],
        pointer: {
          x: 0,
          y: 90,
          containerX: 10,
          containerY: 100,
          isTouch: false,
        },
      }),
    );
    view.rerender(tree(after, "After"));
    expect(chartStore.getState().processedSeries[0].id).toBe(id);
    expect(access.getInteraction("primary-hover")?.targets[0].data).toBe(
      after[0],
    );
    view.rerender(tree(after, "After", false));
    expect(chartStore.getState().processedSeries).toHaveLength(0);
    expect(access.getInteraction("primary-hover")).toBeNull();
    view.unmount();
    engine.dispose();
  },
);

it.each([LineSeries, ScatterSeries])(
  "removes registration when its required accessor is removed",
  (Component) => {
    const chartStore = createChartStore<Row>({}, "x", "y");
    const engine = new Engine<Row>();
    const context: ContextValue<Row> = {
      chartStore,
      engine,
      config: {},
      x: "x",
      y: "y",
      isMobile: false,
      colorPalette: [],
      styles: {},
      resolveInteraction: () => null,
    };
    const tree = (withAccessor: boolean) => (
      <ChartContext.Provider
        value={{ ...context, y: withAccessor ? "y" : undefined }}
      >
        <svg>
          <Component data={before} />
        </svg>
      </ChartContext.Provider>
    );
    const view = render(tree(true));
    expect(chartStore.getState().processedSeries).toHaveLength(1);
    view.rerender(tree(false));
    expect(chartStore.getState().processedSeries).toHaveLength(0);
    view.unmount();
    engine.dispose();
  },
);
