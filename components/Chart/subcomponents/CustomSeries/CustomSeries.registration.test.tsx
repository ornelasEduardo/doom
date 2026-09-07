import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartContext } from "../../context";
import { Engine } from "../../engine";
import {
  createChartStore,
  updateChartData,
  updateChartDimensions,
  updateChartState,
  upsertInteraction,
} from "../../state/store/chart.store";
import {
  ContextValue,
  HoverInteraction,
  InteractionChannel,
  SeriesProps,
} from "../../types";
import { CustomSeries } from "./CustomSeries";

afterEach(cleanup);

const initial = [{ rootX: 80, rootY: 90, localX: 20, localY: 30 }];
const updated = [{ rootX: 70, rootY: 80, localX: 40, localY: 60 }];
type Row = (typeof initial)[number];

describe("CustomSeries real-store registration", () => {
  it.each(["key", "function"] as const)(
    "preserves %s accessors through mount and local/root data updates",
    (kind) => {
      const store = createChartStore({}, "rootX", "rootY");
      updateChartState(store, {
        data: initial,
        xDomain: [0, 100],
        yDomain: [0, 100],
        dimensions: {
          width: 120,
          height: 120,
          innerWidth: 100,
          innerHeight: 100,
          margin: { top: 10, left: 10, bottom: 10, right: 10 },
        },
      });
      const context: ContextValue<Row> = {
        chartStore: store,
        engine: new Engine<Row>(),
        config: {},
        isMobile: false,
        colorPalette: [],
        styles: {},
        resolveInteraction: () => null,
        x: "rootX",
        y: "rootY",
      };
      const accessors: Pick<SeriesProps<Row>, "x" | "y"> = kind === "key"
        ? { x: "localX", y: "localY" }
        : { x: (row) => row.localX, y: (row) => row.localY };
      const tree = (data?: Row[]) => (
        <ChartContext.Provider value={context}>
          <svg>
            <CustomSeries {...accessors} data={data} label="Custom" />
          </svg>
        </ChartContext.Provider>
      );
      const view = render(tree(initial));
      const series = store.getState().processedSeries[0];
      const scales = store.getState().scales;
      expect(
        series.strategy!.find(20, 70, 1, scales.x!, scales.y!),
      ).toMatchObject({ data: initial[0], coordinate: { x: 20, y: 70 } });
      const hover: HoverInteraction<Row> = {
        pointer: {
          x: 20,
          y: 70,
          containerX: 30,
          containerY: 80,
          isTouch: false,
        },
        targets: [
          {
            seriesId: series.id,
            dataIndex: 0,
            data: initial[0],
            coordinate: { x: 30, y: 80 },
          },
        ],
      };
      const target = () =>
        (
          store
            .getState()
            .interactions.get(
              InteractionChannel.PRIMARY_HOVER,
            ) as HoverInteraction<Row>
        ).targets[0];
      act(() => {
        upsertInteraction(store, InteractionChannel.PRIMARY_HOVER, hover);
        updateChartDimensions(store, 120, 120);
      });
      expect(target()).toMatchObject({
        data: initial[0],
        coordinate: { x: 30, y: 80 },
      });
      view.rerender(tree(updated));
      expect(target()).toMatchObject({
        data: updated[0],
        coordinate: { x: 50, y: 50 },
      });
      act(() => updateChartData(store, [{ ...initial[0], rootY: 50 }]));
      expect(target()).toMatchObject({
        data: updated[0],
        coordinate: { x: 50, y: 50 },
      });
      view.rerender(tree());
      act(() => updateChartData(store, updated));
      expect(target()).toMatchObject({
        data: updated[0],
        coordinate: { x: 50, y: 50 },
      });
      view.unmount();
      expect(store.getState().processedSeries).toHaveLength(0);
      expect(store.getState().seriesConfigs.size).toBe(0);
      context.engine.dispose();
    },
  );
});
