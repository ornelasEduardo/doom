import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { useChartContext } from "../../../components/Chart/context";
import type {
  ContextValue,
  RenderFrame,
} from "../../../components/Chart/types/context";
import type { HoverInteraction } from "../../../components/Chart/types/interaction";
import {
  createInteractionAccess,
  createInteractionChannel,
} from "../../../components/Chart/utils/interactionChannels";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

interface Row {
  x: number;
  y: number;
}
afterEach(cleanup);

it.each([false, true])(
  "uses live custom geometry for keyboard slices (off-domain: %s)",
  async (offDomain) => {
    let context!: ContextValue<Row>;
    const frames: RenderFrame<Row>[] = [];
    const channel =
      createInteractionChannel<HoverInteraction<Row>>("custom-keyboard");
    function Probe() {
      context = useChartContext<Row>();
      return null;
    }
    const draw = (slot: number) => (frame: RenderFrame<Row>) => {
      frames[slot] = frame;
      frame.container
        .selectAll("circle")
        .data([frame.data[0]])
        .join("circle")
        .attr("cx", 100)
        .attr("cy", 70 + slot * 30)
        .attr("r", 8);
      frame.geometry.update([
        { x: 100, y: 70 + slot * 30, data: frame.data[0], dataIndex: 0 },
      ]);
    };
    const data = [
      { x: offDomain ? 200 : 10, y: offDomain ? 200 : 20 },
      { x: 90, y: 80 },
    ];
    const view = render(
      <DesignSystemProvider>
        <Chart.Root
          behaviors={[]}
          data={data}
          sensors={[Chart.sensors.KeyboardSensor({ name: channel })]}
          style={{ width: 600, height: 400 }}
          x="x"
          xDomain={[0, 100]}
          y="y"
          yDomain={[0, 100]}
        >
          <Chart.Plot>
            <Chart.Series label="First" render={draw(0)} x="x" y="y" />
            <Chart.Series label="Second" render={draw(1)} x="x" y="y" />
            <Probe />
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>,
    );
    await expect.poll(() => frames[1]?.geometry).toBeDefined();
    const hover = (custom = false) =>
      custom
        ? createInteractionAccess(context.chartStore).getInteraction(channel)
        : createInteractionAccess(context.chartStore).getInteraction(
            "primary-hover",
          );
    const root = view.container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    root.focus();
    expect(document.activeElement).toBe(root);
    const press = () => userEvent.keyboard("{ArrowRight}");
    await press();
    for (const custom of [false, true]) {
      await expect
        .poll(() => hover(custom)?.targets.map((t) => t.coordinate))
        .toEqual([
          { x: 150, y: 90 },
          { x: 150, y: 120 },
        ]);
      expect(hover(custom)!.targets.map((t) => t.dataIndex)).toEqual([0, 0]);
      expect(
        hover(custom)!.targets.every((t) => t.geometryOwner !== undefined),
      ).toBe(true);
      expect(hover(custom)!.target?.data).toBe(data[0]);
      expect(hover(custom)!.pointer).toMatchObject({ x: 100, y: 70 });
    }
    await press(); // The unpublished second row must never become a keyboard target.
    expect(hover()!.targets.map((t) => t.dataIndex)).toEqual([0, 0]);
    const token = hover()!.targets[0].geometryOwner;
    frames[0].geometry.update([{ x: 130, y: 80, data: data[0], dataIndex: 0 }]);
    await expect
      .poll(() => hover()?.targets[0].coordinate)
      .toEqual({ x: 180, y: 100 });
    expect(hover()!.targets[0].geometryOwner).toBe(token);
    expect(hover()!.targets).toHaveLength(2);
    frames[0].geometry.update([]);
    await expect.poll(() => hover()?.targets).toHaveLength(1);
    frames[1].geometry.dispose();
    await expect.poll(hover).toBeNull();
    await press();
    expect(hover()).toBeNull();
    expect(hover(true)).toBeNull();
  },
);
