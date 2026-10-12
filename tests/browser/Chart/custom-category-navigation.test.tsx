import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import { buildGrid } from "../../../components/Chart/engine/PreparedGrid";
import type {
  ContextValue,
  RenderFrame,
} from "../../../components/Chart/types/context";
import { createInteractionAccess } from "../../../components/Chart/utils/interactionChannels";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

type Datum = { x: number; y: number };
it.each([
  { withLazy: false, repeated: false },
  { withLazy: true, repeated: false },
  { withLazy: false, repeated: true },
  { withLazy: true, repeated: true },
])(
  "preserves ordinary custom category slices with lazy geometry: %s",
  async ({ withLazy, repeated }) => {
    let context!: ContextValue<Datum>;
    const ids = new Map<string, string>();
    const get = vi.fn((dataIndex: number) => ({
      x: 300,
      y: 80,
      dataIndex,
      data: { x: 0, y: 1 },
    }));
    function Probe() {
      context = useChartContext<Datum>();
      return null;
    }
    const ordinary =
      (name: string, x: number) => (frame: RenderFrame<Datum>) => {
        ids.set(name, frame.seriesId);
        frame.geometry.update(
          frame.data.map((data, dataIndex) => ({
            data,
            dataIndex,
            x: x + dataIndex * 20,
            y: 80,
          })),
        );
      };
    const lazy = (frame: RenderFrame<Datum>) => {
      ids.set("lazy", frame.seriesId);
      frame.geometry.updatePrepared(
        { length: 1, get },
        buildGrid(new Float64Array([300, 80])),
        { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
      );
    };
    const view = render(
      <DesignSystemProvider>
        <Chart.Root
          behaviors={[]}
          data={[
            { x: 0, y: 1 },
            { x: repeated ? 0 : 1, y: 2 },
          ]}
          style={{ width: 600, height: 400 }}
          x="x"
          y="y"
        >
          <Chart.Plot>
            <Chart.Series label="A" render={ordinary("a", 100)} x="x" y="y" />
            <Chart.Series label="B" render={ordinary("b", 200)} x="x" y="y" />
            {withLazy && <Chart.Series label="Lazy" render={lazy} />}
            <Probe />
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>,
    );
    await expect.poll(() => ids.size).toBe(withLazy ? 3 : 2);
    view.container
      .querySelector<HTMLElement>("[data-chart-container]")!
      .focus();
    const targets = () =>
      createInteractionAccess(context.chartStore)
        .getInteraction("primary-hover")
        ?.targets.map(({ seriesId, dataIndex }) => [seriesId, dataIndex]);
    await userEvent.keyboard("{ArrowRight}");
    expect(targets()).toEqual([
      [ids.get("a"), 0],
      [ids.get("b"), 0],
    ]);
    await userEvent.keyboard("{ArrowRight}");
    expect(targets()).toEqual([
      [ids.get("a"), 1],
      [ids.get("b"), repeated ? 0 : 1],
    ]);
    expect(get).not.toHaveBeenCalled();
    if (withLazy) {
      await userEvent.keyboard("{ArrowRight}");
      expect(targets()).toEqual([[ids.get("lazy"), 0]]);
      expect(get).toHaveBeenCalledTimes(1);
      await userEvent.keyboard("{ArrowLeft}");
      expect(targets()).toEqual([
        [ids.get("a"), 1],
        [ids.get("b"), repeated ? 0 : 1],
      ]);
    }
  },
);
