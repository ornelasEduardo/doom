import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { cdp } from "vitest/browser";

import { ChartContext } from "../../../components/Chart/context";
import { Engine, InputAction } from "../../../components/Chart/engine";
import { DragSensor } from "../../../components/Chart/sensors/DragSensor/DragSensor";
import { InteractionLayer } from "../../../components/Chart/subcomponents/InteractionLayer/InteractionLayer";
import { ContextValue } from "../../../components/Chart/types/context";
import { SensorContext } from "../../../components/Chart/types/events";

afterEach(cleanup);
const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
function Surface({
  engine,
  id,
  children,
}: {
  engine: Engine;
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <ChartContext.Provider value={{ engine } as ContextValue}>
      <div
        data-chart-container
        data-testid={id}
        style={{ width: 250, height: 200, margin: 10 }}
      >
        <InteractionLayer />
        {children}
      </div>
    </ChartContext.Provider>
  );
}
function bind(engine: Engine, root: HTMLElement) {
  engine.updateBounds(root.getBoundingClientRect(), {
    x: 0,
    y: 0,
    width: 250,
    height: 200,
  });
}

it
  .skipIf(!navigator.userAgent.includes("Chrome"))
  .each(["preventDefault", "capturePointer"] as const)(
  "outside dismissal cannot use %s on a native touch belonging to another chart",
  async (capability) => {
    let dismissed = 0;
    let foreignCapture = false;
    let prevented: boolean | undefined;
    const a = new Engine({
      onEvent: ({ signal }) => {
        if (signal.action !== InputAction.CANCEL) {
          return;
        }
        dismissed++;
        signal.native?.[capability]();
        foreignCapture = first.hasPointerCapture(signal.id);
      },
    });
    const b = new Engine();
    const clicked = vi.fn();
    const { getByTestId } = render(
      <>
        <Surface engine={a} id="a" />
        <Surface engine={b} id="b">
          <button style={{ width: 160, height: 70 }} onClick={clicked}>
            Native action
          </button>
        </Surface>
      </>,
    );
    const first = getByTestId("a");
    const second = getByTestId("b");
    bind(a, first);
    bind(b, second);
    second.addEventListener("pointerdown", (event) => {
      prevented = event.defaultPrevented;
    });
    const box = second.querySelector("button")!.getBoundingClientRect();
    await cdp().send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.left + 30, y: box.top + 30, id: 1 }],
    });
    try {
      expect(dismissed).toBe(1);
      expect(prevented).toBe(false);
      expect(foreignCapture).toBe(false);
    } finally {
      await cdp().send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    }
    await expect.poll(() => clicked.mock.calls.length).toBe(1);
  },
);

it.skipIf(!navigator.userAgent.includes("Chrome"))(
  "a failed deferred drag releases native capture before pointerup and a fresh drag completes",
  async () => {
    const onDrag = vi.fn().mockImplementationOnce(() => {
      throw new Error("consumer");
    });
    const onDragEnd = vi.fn();
    const errors: unknown[] = [];
    const interactions = new Map();
    let pointerId = -1;
    const sensor = DragSensor({ onDrag, onDragEnd });
    const context = {
      getChartContext: () => ({
        engine,
        chartStore: { getState: () => ({ scales: {} }) },
      }),
      upsertInteraction: (key: string, value: unknown) =>
        interactions.set(key, value),
      removeInteraction: (key: string) => interactions.delete(key),
    } as unknown as SensorContext;
    const engine = new Engine({
      useDomHitTesting: false,
      onEvent: (event) => {
        if (event.signal.action === InputAction.START) {
          pointerId = event.signal.id;
        }
        try {
          sensor(event, context);
        } catch (error) {
          errors.push(error);
        }
      },
    });
    engine.updateData([
      { x: 20, y: 20, data: { point: true }, seriesId: "s", dataIndex: 0 },
    ]);
    const { getByTestId } = render(<Surface engine={engine} id="drag" />);
    const root = getByTestId("drag");
    bind(engine, root);
    const box = root.getBoundingClientRect();
    const mouse = (
      type: "mousePressed" | "mouseMoved" | "mouseReleased",
      x: number,
      buttons: number,
    ) =>
      cdp().send("Input.dispatchMouseEvent", {
        type,
        x: box.left + x,
        y: box.top + 20,
        button: "left",
        buttons,
        clickCount: 1,
      });
    await mouse("mousePressed", 20, 1);
    try {
      expect(root.hasPointerCapture(pointerId)).toBe(true);
      await mouse("mouseMoved", 40, 1);
      await frame();
      expect(errors).toHaveLength(1);
      expect(interactions.size).toBe(0);
      expect(root.hasPointerCapture(pointerId)).toBe(false);
    } finally {
      await mouse("mouseReleased", 40, 0);
    }
    expect(onDragEnd).not.toHaveBeenCalled();
    await mouse("mousePressed", 20, 1);
    try {
      expect(root.hasPointerCapture(pointerId)).toBe(true);
      await mouse("mouseMoved", 280, 1);
      await frame();
      expect(onDrag).toHaveBeenCalledTimes(2);
    } finally {
      await mouse("mouseReleased", 280, 0);
    }
    expect(onDragEnd).toHaveBeenCalledOnce();
    expect(root.hasPointerCapture(pointerId)).toBe(false);
  },
);
