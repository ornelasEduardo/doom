import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { commands, page, server } from "vitest/browser";

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
  "maps delivered native pointers across fractional %s boundaries at scale %s",
  async (boxSizing, scale) => {
    // Fit the runner window without its preview transform.
    await page.viewport(1200, 700);
    let latest: EngineEvent | undefined;
    let native: { x: number; y: number } | undefined;
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
            onPointerMove={(event) => {
              native = { x: event.clientX, y: event.clientY };
            }}
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
    const rootRect = container
      .querySelector("[data-chart-container]")!
      .getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const borderWidth = boxSizing === "border-box" ? 600.25 : 631.75;
    const borderHeight = boxSizing === "border-box" ? 300.25 : 323.75;
    const hover = async (clientX: number, clientY: number) => {
      latest = undefined;
      native = undefined;
      await commands.moveChartPointer(clientX, clientY);
      await expect.poll(() => latest).toBeDefined();
      expect(native).toBeDefined();
      // Firefox/WebKit deliver integer client coordinates; Firefox also
      // quantizes transformed bounds. Assert the delivered event, not the request.
      const expectedX =
        ((native!.x - svgRect.left) * borderWidth) / rootRect.width - 40;
      const expectedY =
        ((native!.y - svgRect.top) * borderHeight) / rootRect.height - 20;
      // Only allow floating-point operation-order noise, far below a layout pixel.
      expect(latest!.chartX).toBeCloseTo(expectedX, 12);
      expect(latest!.chartY).toBeCloseTo(expectedY, 12);
      expect(latest!.isWithinPlot).toBe(
        expectedX >= 0 &&
          expectedX <= width &&
          expectedY >= 0 &&
          expectedY <= height,
      );
      if (server.browser === "chromium") {
        expect(native).toEqual({ x: clientX, y: clientY });
      }
    };
    const centerX = Math.floor(rect.left + rect.width / 2);
    const centerY = Math.floor(rect.top + rect.height / 2);
    await hover(rect.left, centerY);
    if (server.browser === "chromium") {
      expect(latest?.chartX).toBe(0);
      expect(latest?.isWithinPlot).toBe(true);
    }
    await hover(centerX, rect.top);
    if (server.browser === "chromium") {
      expect(latest?.chartY).toBe(0);
      expect(latest?.isWithinPlot).toBe(true);
    }
    await hover(rect.right, centerY);
    if (server.browser === "chromium") {
      expect(latest?.chartX).toBe(width);
      expect(latest?.isWithinPlot).toBe(true);
    }
    await hover(centerX, rect.bottom);
    if (server.browser === "chromium") {
      expect(latest?.chartY).toBe(height);
      expect(latest?.isWithinPlot).toBe(true);
    }
    if (server.browser === "chromium") {
      await hover(rect.left - 0.125 * scale, centerY);
      expect(latest?.chartX).toBe(-0.125);
      expect(latest?.isWithinPlot).toBe(false);
    }

    // Integer requests immediately either side of every edge remain distinct
    // even in engines whose native mouse events discard subpixels.
    for (const [x, y, inside] of [
      [Math.ceil(rect.left) + 1, centerY, true],
      [Math.floor(rect.left) - 1, centerY, false],
      [Math.floor(rect.right) - 1, centerY, true],
      [Math.ceil(rect.right) + 1, centerY, false],
      [centerX, Math.ceil(rect.top) + 1, true],
      [centerX, Math.floor(rect.top) - 1, false],
      [centerX, Math.floor(rect.bottom) - 1, true],
      [centerX, Math.ceil(rect.bottom) + 1, false],
    ] as const) {
      await hover(x, y);
      expect(latest?.isWithinPlot).toBe(inside);
    }
  },
);
