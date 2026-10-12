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

it("retains built-in slices and tagged DOM custom targets alongside lazy geometry", async () => {
  let context!: ContextValue<{ x: number; y: number }>;
  let lazyId = "",
    domId = "";
  const get = vi.fn((index: number) => ({
    x: 100 + index,
    y: 80,
    dataIndex: index,
    data: { x: index, y: 80 },
  }));
  function Probe() {
    context = useChartContext();
    return null;
  }
  const lazy = (frame: RenderFrame<{ x: number; y: number }>) => {
    lazyId = frame.seriesId;
    frame.geometry.updatePrepared(
      { length: 1, get },
      buildGrid(new Float64Array([100, 80])),
      { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
    );
  };
  const dom = (frame: RenderFrame<{ x: number; y: number }>) => {
    domId = frame.seriesId;
    frame.container
      .selectAll("circle")
      .data([frame.data[0]])
      .join("circle")
      .attr("cx", 150)
      .attr("cy", 80)
      .attr("r", 5)
      .attr(frame.chartDataAttrs.TYPE, "data-point")
      .attr(frame.chartDataAttrs.SERIES_ID, frame.seriesId)
      .attr(frame.chartDataAttrs.INDEX, 0);
  };
  const view = render(
    <DesignSystemProvider>
      <Chart.Root
        behaviors={[]}
        data={[
          { x: 0, y: 10 },
          { x: 10, y: 20 },
        ]}
        style={{ width: 600, height: 400 }}
        x="x"
        y="y"
      >
        <Chart.Plot>
          <Chart.Series label="A" type="line" />
          <Chart.Series label="B" type="line" />
          <Chart.Series label="Lazy" render={lazy} />
          <Chart.Series label="DOM" render={dom} />
          <Probe />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>,
  );
  await expect.poll(() => lazyId && domId).toBeTruthy();
  const root = view.container.querySelector<HTMLElement>(
    "[data-chart-container]",
  )!;
  root.focus();
  const hover = () =>
    createInteractionAccess(context.chartStore).getInteraction("primary-hover");
  await userEvent.keyboard("{ArrowRight}");
  expect(hover()?.targets).toHaveLength(2);
  const visited = new Set(hover()?.targets.map((t) => t.seriesId));
  for (let i = 0; i < 5; i++) {
    await userEvent.keyboard("{ArrowRight}");
    hover()?.targets.forEach((t) => visited.add(t.seriesId));
  }
  expect(visited.has(lazyId)).toBe(true);
  expect(visited.has(domId)).toBe(true);
  expect(get).toHaveBeenCalledTimes(1);
});
