import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { Engine, InputAction, InputSignal, InputSource } from "../../engine";
import {
  createChartStore,
  updateChartData,
  updateChartDimensions,
} from "../../state/store/chart.store";
import type { ContextValue, Sensor } from "../../types";
import { createInteractionAccess } from "../../utils/interactionChannels";
import { DragSensor } from "../DragSensor/DragSensor";
import { SensorManager } from "./SensorManager";

const datum = { x: 1, y: 2 };
const start: InputSignal = {
  id: 7,
  userId: "local",
  source: InputSource.MOUSE,
  action: InputAction.START,
  x: 20,
  y: 20,
  timestamp: 0,
};
function setup() {
  const chartStore = createChartStore<typeof datum>({ type: "line" }, "x", "y");
  updateChartDimensions(chartStore, 500, 300);
  updateChartData(chartStore, [datum]);
  const engine = new Engine<typeof datum>({ useDomHitTesting: false });
  engine.updateData([
    { x: 20, y: 20, data: datum, seriesId: "s", dataIndex: 0 },
  ]);
  const value: ContextValue<typeof datum> = {
    chartStore,
    engine,
    config: { type: "line" },
    colorPalette: [],
    styles: {},
    isMobile: false,
    resolveInteraction: () => null,
  };
  return {
    value,
    engine,
    chartStore,
    access: createInteractionAccess(chartStore),
  };
}
afterEach(cleanup);

it.each(["stream", "chart"] as const)(
  "%s cancellation invalidates remaining START sensors but accepts a fresh gesture",
  (cancelScope) => {
    const { engine, value, access } = setup();
    let cancel = true;
    const cancelFirst: Sensor<typeof datum> = ({ signal }) => {
      if (cancel && signal.action === InputAction.START) {
        engine.input({ ...signal, action: InputAction.CANCEL, cancelScope });
      }
    };
    const ended = vi.fn();
    render(
      <SensorManager
        sensors={[cancelFirst, DragSensor({ onDragEnd: ended })]}
        value={value}
      />,
    );
    engine.input({ ...start });
    expect(access.getInteraction("drag")).toBeNull();
    engine.input({ ...start, action: InputAction.END });
    expect(ended).not.toHaveBeenCalled();
    cancel = false;
    engine.input({ ...start });
    expect(access.getInteraction("drag")?.isDragging).toBe(true);
    engine.input({ ...start, action: InputAction.END });
    expect(ended).toHaveBeenCalledOnce();
  },
);

it.each([{ id: 8 }, { source: InputSource.PEN }, { userId: "another" }])(
  "stream cancellation preserves unrelated in-flight input %j",
  (other) => {
    const { engine, value, access } = setup();
    const cancelOther: Sensor<typeof datum> = ({ signal }) => {
      if (signal.action === InputAction.START) {
        engine.input({ ...signal, ...other, action: InputAction.CANCEL });
      }
    };
    render(
      <SensorManager sensors={[cancelOther, DragSensor()]} value={value} />,
    );
    engine.input({ ...start });
    expect(access.getInteraction("drag")?.isDragging).toBe(true);
  },
);

it.each(["dispose", "detach"] as const)(
  "%s clears drag closure and prevents a stale END after reactivation",
  (method) => {
    const { engine, value, access } = setup();
    const ended = vi.fn();
    const sensors = [DragSensor({ onDragEnd: ended })];
    const view = render(<SensorManager sensors={sensors} value={value} />);
    engine.input({ ...start });
    expect(access.getInteraction("drag")?.isDragging).toBe(true);
    if (method === "dispose") {
      engine.dispose();
    } else {
      view.unmount();
    }
    expect(access.getInteraction("drag")).toBeNull();
    engine.activate();
    if (method === "detach") {
      render(<SensorManager sensors={sensors} value={value} />);
    }
    engine.input({ ...start, action: InputAction.END });
    expect(ended).not.toHaveBeenCalled();
    engine.input({ ...start });
    engine.input({ ...start, action: InputAction.END });
    expect(ended).toHaveBeenCalledOnce();
  },
);

it("streaming a different row count preserves an active drag", () => {
  const { engine, value, chartStore, access } = setup();
  render(<SensorManager sensors={[DragSensor()]} value={value} />);
  engine.input({ ...start });
  act(() => updateChartData(chartStore, [datum, { x: 2, y: 3 }]));
  expect(access.getInteraction("drag")?.isDragging).toBe(true);
});

it("disposal during START invalidates its remaining sensors even after activate is attempted", () => {
  const { engine, value, access } = setup();
  let dispose = true;
  const first: Sensor<typeof datum> = ({ signal }) => {
    if (dispose && signal.action === InputAction.START) {
      engine.dispose();
      engine.activate();
    }
  };
  render(<SensorManager sensors={[first, DragSensor()]} value={value} />);
  const signal = { ...start };
  engine.input(signal);
  expect(access.getInteraction("drag")).toBeNull();
  dispose = false;
  engine.input(signal);
  expect(access.getInteraction("drag")?.isDragging).toBe(true);
});

it.each(["MOVE", "END"] as const)(
  "disposal from a %s store notification cannot invoke a stale drag callback",
  (action) => {
    const { engine, value, access } = setup();
    const moved = vi.fn();
    const ended = vi.fn();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <SensorManager
          sensors={[DragSensor({ onDrag: moved, onDragEnd: ended })]}
          value={value}
        />,
      );
      engine.input({ ...start });
      const unsubscribe = access.subscribeInteraction("drag", () =>
        engine.dispose(),
      );
      if (action === "MOVE") {
        engine.input({ ...start, action: InputAction.MOVE, x: 30 });
      }
      engine.input({ ...start, action: InputAction.END, x: 30 });
      unsubscribe();
      expect(moved).not.toHaveBeenCalled();
      expect(ended).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(access.getInteraction("drag")).toBeNull();
    } finally {
      errors.mockRestore();
    }
  },
);

it.each(["dispose", "detach"] as const)(
  "%s delivers one chart cancellation to each sensor during teardown",
  (method) => {
    const { engine, value } = setup();
    const cancelled = vi.fn();
    const sensor: Sensor<typeof datum> = ({ signal }) => {
      if (
        signal.action === InputAction.CANCEL &&
        signal.cancelScope === "chart"
      ) {
        cancelled();
      }
    };
    const view = render(<SensorManager sensors={[sensor]} value={value} />);
    if (method === "dispose") {
      engine.dispose();
    }
    view.unmount();
    engine.dispose();
    expect(cancelled).toHaveBeenCalledOnce();
  },
);
