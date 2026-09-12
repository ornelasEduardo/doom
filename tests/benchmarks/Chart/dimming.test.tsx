import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { Chart } from "../../../components/Chart/Chart";
import { InputAction } from "../../../components/Chart/engine";
import type { Sensor } from "../../../components/Chart/types/events";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

const frame = () =>
  new Promise<number>((resolve) => requestAnimationFrame(resolve));
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    median: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted.at(-1),
  };
};
afterEach(cleanup);

// Informational benchmark: retain stdout to compare runs on the same browser/machine.
// BROWSER_TEST_PORT=63406 npm run test:performance:chart
it("measures dense scatter pointer frames with disabled, Dim-only and default behaviors", async () => {
  for (const mode of ["none", "dim", "default"] as const) {
    const data = Array.from({ length: 5000 }, (_, i) => ({
      x: (i * 37) % 1000,
      y: (i * 53) % 600,
    }));
    const costs: number[] = [],
      frames: number[] = [],
      activationFrames: number[] = [];
    const hover = Chart.sensors.DataHoverSensor();
    const sensor: Sensor<(typeof data)[number]> = (event, context) => {
      const start = performance.now();
      hover(event, context);
      if (event.signal.action === InputAction.MOVE) {
        costs.push(performance.now() - start);
      }
    };
    const view = render(
      <DesignSystemProvider>
        <Chart
          behaviors={
            mode === "default"
              ? undefined
              : mode === "dim"
                ? [
                    Chart.behaviors.Dim({
                      selector: ".chart-scatter-series circle",
                    }),
                  ]
                : []
          }
          data={data}
          sensors={[sensor]}
          style={{ width: 900, height: 650 }}
          type="scatter"
          x="x"
          y="y"
        />
      </DesignSystemProvider>,
    );
    const chart = view.container.querySelector<HTMLElement>(
      "[data-chart-container]",
    )!;
    await expect.poll(() => chart.querySelectorAll("circle").length).toBe(5000);
    await frame();
    await frame();
    const rect = chart.getBoundingClientRect();
    let previous = await frame();
    for (let i = 0; i < 80; i++) {
      const now = await frame();
      if (i >= 20) {
        frames.push(now - previous);
      }
      if (i >= 1 && i <= 3) {
        activationFrames.push(now - previous);
      }
      previous = now;
      chart.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: rect.left + 100 + ((i * 47) % 650),
          clientY: rect.top + 150 + ((i * 29) % 350),
          pointerId: 1,
          pointerType: "mouse",
        }),
      );
    }
    await frame();
    await frame();
    expect(costs.length).toBeGreaterThan(0);
    console.log(
      "DIM_BENCHMARK",
      JSON.stringify({
        browser: navigator.userAgent,
        mode,
        count: data.length,
        activationFrames,
        activationHandlerMs: costs[0],
        handlerMs: stats(costs.slice(20)),
        frameMs: stats(frames),
      }),
    );
    view.unmount();
    await frame();
  }
}, 60000);
