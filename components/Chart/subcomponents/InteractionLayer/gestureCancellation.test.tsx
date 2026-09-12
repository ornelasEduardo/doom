import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { ChartContext } from "../../context";
import { Engine, InputAction, InputSignal } from "../../engine";
import { DragSensor } from "../../sensors/DragSensor/DragSensor";
import { ContextValue } from "../../types/context";
import { SensorContext } from "../../types/events";
import { InteractionLayer } from "./InteractionLayer";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const bounds = { left: 0, top: 0, width: 200, height: 200 } as DOMRect;
function Layer({ engine, id }: { engine: Engine; id: string }) {
  return (
    <ChartContext.Provider value={{ engine } as ContextValue}>
      <div data-chart-container data-testid={id}>
        <InteractionLayer />
      </div>
    </ChartContext.Provider>
  );
}

it("outside touch dismissal cannot prevent or capture another chart's pointer", () => {
  const cancellations: InputSignal[] = [];
  const engine = new Engine({
    onEvent: ({ signal }) => {
      cancellations.push(signal);
      signal.native?.preventDefault();
      signal.native?.capturePointer();
    },
  });
  const other = new Engine();
  engine.updateBounds(bounds);
  other.updateBounds(bounds);
  const { getByTestId } = render(
    <>
      <Layer engine={engine} id="a" />
      <Layer engine={other} id="b" />
    </>,
  );
  const capture = vi.fn();
  getByTestId("a").setPointerCapture = capture;
  getByTestId("a").hasPointerCapture = () => false;
  const event = new PointerEvent("pointerdown", {
    pointerId: 7,
    pointerType: "touch",
    bubbles: true,
    cancelable: true,
  });
  fireEvent(getByTestId("b"), event);
  expect(cancellations).toHaveLength(1);
  expect(cancellations[0]).toMatchObject({
    action: InputAction.CANCEL,
    cancelScope: "chart",
  });
  expect(event.defaultPrevented).toBe(false);
  expect(capture).not.toHaveBeenCalled();
});

it("failed deferred drag updates release capture and allow a fresh drag", () => {
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  const onDrag = vi.fn().mockImplementationOnce(() => {
    throw new Error("consumer");
  });
  const onDragEnd = vi.fn();
  const sensor = DragSensor({ onDrag, onDragEnd });
  const interactions = new Map();
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
    onEvent: (event) => sensor(event, context),
  });
  engine.updateBounds(bounds, { x: 0, y: 0, width: 200, height: 200 });
  engine.updateData([
    { x: 20, y: 20, data: { id: "point" }, seriesId: "s", dataIndex: 0 },
  ]);
  const { getByTestId } = render(<Layer engine={engine} id="chart" />);
  const root = getByTestId("chart");
  const captured = new Set<number>();
  root.setPointerCapture = (id) => {
    captured.add(id);
  };
  root.hasPointerCapture = (id) => captured.has(id);
  root.releasePointerCapture = (id) => {
    captured.delete(id);
  };
  const pointer = (type: string, x = 20) =>
    fireEvent(
      root,
      new PointerEvent(type, {
        pointerId: 7,
        pointerType: "mouse",
        clientX: x,
        clientY: 20,
        bubbles: true,
      }),
    );
  pointer("pointerdown");
  expect(captured.has(7)).toBe(true);
  pointer("pointermove", 30);
  expect(() => frame(16)).toThrow("consumer");
  expect(interactions.size).toBe(0);
  expect(captured.has(7)).toBe(false);
  pointer("pointerup", 30);
  expect(onDragEnd).not.toHaveBeenCalled();
  pointer("pointerdown");
  expect(captured.has(7)).toBe(true);
  pointer("pointermove", 40);
  pointer("pointerup", 40);
  expect(onDragEnd).toHaveBeenCalledOnce();
  expect(captured.has(7)).toBe(false);
});
