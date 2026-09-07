import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { commands, page } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import {
  type EngineEvent,
  InputAction,
} from "../../../components/Chart/engine";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

it.each([
  ["border-box", 1],
  ["content-box", 1],
  ["border-box", 0.75],
  ["content-box", 0.75],
] as const)(
  "keeps native pointer boundaries exact for fractional %s at scale %s",
  async (boxSizing, scale) => {
    // Fit the runner window without its preview transform.
    await page.viewport(1200, 700);
    let latest: EngineEvent | undefined;
    const observe = (event: EngineEvent) => {
      if (event.signal.action === InputAction.MOVE) {
        latest = event;
      }
    };
    const { container } = render(
      <DesignSystemProvider>
        <div
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <Chart
            d3Config={{ margin: { left: 40, top: 20, right: 20, bottom: 30 } }}
            data={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            sensors={[observe]}
            style={{
              boxSizing,
              width: 600.25,
              height: 300.25,
              padding: "8.25px 12.25px",
              borderWidth: "3px 4px 4px 3px",
            }}
            type="line"
            x="x"
            y="y"
          >
            <Chart.Plot>
              <Chart.Series type="line" />
            </Chart.Plot>
          </Chart>
        </div>
      </DesignSystemProvider>,
    );
    const svg = container.querySelector("svg[data-chart-plot]")!;
    await expect
      .poll(() => Number(svg.getAttribute("width")))
      .toBeGreaterThan(500);
    const plot = container.querySelector("[data-chart-inner-plot] > rect")!;
    await expect
      .poll(() => plot?.getBoundingClientRect().width ?? 0)
      .toBeGreaterThan(400 * scale);
    const width = Number(plot.getAttribute("width"));
    const height = Number(plot.getAttribute("height"));
    const rect = plot.getBoundingClientRect();
    const hover = async (x: number, y: number) => {
      latest = undefined;
      await commands.moveChartPointer(
        rect.left + x * scale,
        rect.top + y * scale,
      );
      await expect.poll(() => latest).toBeDefined();
    };
    await hover(0, height / 2);
    expect(latest?.chartX).toBe(0);
    expect(latest?.isWithinPlot).toBe(true);
    await hover(width / 2, 0);
    expect(latest?.chartY).toBe(0);
    expect(latest?.isWithinPlot).toBe(true);
    await hover(width, height / 2);
    expect(latest?.chartX).toBe(width);
    expect(latest?.isWithinPlot).toBe(true);
    await hover(width / 2, height);
    expect(latest?.chartY).toBe(height);
    expect(latest?.isWithinPlot).toBe(true);
    await hover(-0.125, height / 2);
    expect(latest?.chartX).toBe(-0.125);
    expect(latest?.isWithinPlot).toBe(false);
  },
);
