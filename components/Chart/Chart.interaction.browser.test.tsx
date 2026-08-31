/**
 * Drag and selection, end to end.
 *
 * Both sensors have unit tests, but nothing exercised them through the real
 * pipeline. Scale inversion in particular only means something against real
 * geometry: in happy-dom every coordinate is zero, so a dragged value cannot
 * be distinguished from a broken one.
 *
 * These also drive the extension API from the package entry, which is how a
 * consumer would wire a custom sensor.
 */
import "../../styles/globals.scss";

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DesignSystemProvider } from "../../DesignSystemProvider";
import { Chart } from "./Chart";
import { InteractionChannel, type Sensor, type SensorContext } from "./index";

const rows = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: i,
  y: 20 + i * 10,
}));

const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

const settle = async () => {
  await frame();
  await new Promise((r) => setTimeout(r, 150));
  await frame();
};

const pointer = async (
  el: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  clientX: number,
  clientY: number,
) => {
  el.dispatchEvent(
    new PointerEvent(type, {
      clientX,
      clientY,
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
    }),
  );
  await frame();
};

let teardown: Array<() => void> = [];
afterEach(() => {
  teardown.forEach((fn) => fn());
  teardown = [];
});

const mount = async (ui: React.ReactElement) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const result = render(
    <DesignSystemProvider initialTheme="default">{ui}</DesignSystemProvider>,
    { container: host },
  );
  teardown.push(() => {
    result.unmount();
    host.remove();
  });
  await settle();
  const root = host.querySelector("[data-chart-container]") as HTMLElement;
  expect(root).toBeTruthy();
  return { host, root };
};

const centreOf = (host: HTMLElement, index: number) => {
  const circle = host.querySelectorAll("circle")[index];
  expect(circle).toBeTruthy();
  const r = circle.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

describe("drag", () => {
  it("reports scale-inverted values while dragging", async () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const sensors = [Chart.sensors.DragSensor({ onDrag, onDragEnd })];

    const { host, root } = await mount(
      <Chart
        d3Config={{ showDots: true }}
        data={rows}
        sensors={sensors}
        style={{ width: 600, height: 360 }}
        type="scatter"
        x="x"
        y="y"
      />,
    );

    const start = centreOf(host, 2);
    await pointer(root, "pointerdown", start.x, start.y);
    // Drag upward: on a y scale that means a larger value.
    await pointer(root, "pointermove", start.x, start.y - 60);
    await pointer(root, "pointerup", start.x, start.y - 60);

    expect(onDrag).toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalled();

    const [originalData, newValue] = onDragEnd.mock.calls.at(-1)!;
    expect(originalData).toMatchObject({ id: 2 });

    // The value has to come back in the data domain, not in pixels. At this
    // fixed 600x360 size, dragging point 2 (y = 40) up 60px reports 57.14;
    // without the scale inversion it reports the raw plot coordinate, 80. The
    // bounds separate the two — a looser bound would not.
    const dragged = newValue.y as number;
    const original = (originalData as { y: number }).y;

    expect(Number.isFinite(dragged)).toBe(true);
    expect(dragged).toBeGreaterThan(original);
    expect(dragged).toBeGreaterThan(50);
    expect(dragged).toBeLessThan(65);
  });
});

describe("selection", () => {
  it("selects a point and toggles it off on a second press", async () => {
    // Observe through SensorContext rather than the render prop — this is the
    // API a consumer actually has, and it exercises the extension surface.
    let ctx: SensorContext | null = null;
    const observe: Sensor = (_event, sensorContext) => {
      ctx = sensorContext;
    };

    const { host, root } = await mount(
      <Chart
        d3Config={{ showDots: true }}
        data={rows}
        sensors={[Chart.sensors.SelectionSensor(), observe]}
        style={{ width: 600, height: 360 }}
        type="scatter"
        x="x"
        y="y"
      />,
    );

    // Note: the selection channel carries `selection`, while the hover and drag
    // channels carry `targets`. Worth knowing when writing a custom behavior.
    const selection = () =>
      (
        ctx?.getInteraction(InteractionChannel.SELECTION) as {
          selection?: unknown[];
        } | null
      )?.selection ?? [];

    const point = centreOf(host, 3);

    await pointer(root, "pointerdown", point.x, point.y);
    expect(ctx).not.toBeNull();
    expect(selection()).toHaveLength(1);

    // Pressing the same point again clears it.
    await pointer(root, "pointerdown", point.x, point.y);
    expect(selection()).toHaveLength(0);
  });
});
