import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { cdp } from "vitest/browser";

import { ChartContext } from "../../../components/Chart/context";
import {
  Engine,
  InputAction,
  InputSignal,
} from "../../../components/Chart/engine";
import { DragSensor } from "../../../components/Chart/sensors/DragSensor/DragSensor";
import { SensorManager } from "../../../components/Chart/sensors/SensorManager/SensorManager";
import {
  createChartStore,
  updateChartData,
  updateChartDimensions,
} from "../../../components/Chart/state/store/chart.store";
import { InteractionLayer } from "../../../components/Chart/subcomponents/InteractionLayer/InteractionLayer";
import type { ContextValue, Sensor } from "../../../components/Chart/types";
import { createInteractionAccess } from "../../../components/Chart/utils/interactionChannels";

const datum = { x: 1, y: 2 };
afterEach(cleanup);
function mount(
  makeSensors: (engine: Engine<typeof datum>) => Sensor<typeof datum>[],
) {
  const chartStore = createChartStore<typeof datum>({ type: "line" }, "x", "y");
  updateChartDimensions(chartStore, 250, 200);
  updateChartData(chartStore, [datum]);
  const engine = new Engine<typeof datum>({ useDomHitTesting: false });
  engine.updateData([
    { x: 20, y: 20, data: datum, seriesId: "s", dataIndex: 0 },
  ]);
  const value: ContextValue<typeof datum> = {
    chartStore,
    engine,
    config: { type: "line" },
    styles: {},
    colorPalette: [],
    isMobile: false,
    resolveInteraction: () => null,
  };
  const view = render(
    <ChartContext.Provider value={value}>
      <div data-chart-container style={{ width: 250, height: 200 }}>
        <InteractionLayer />
        <SensorManager sensors={makeSensors(engine)} value={value} />
      </div>
    </ChartContext.Provider>,
  );
  const root = view.container.firstElementChild as HTMLElement;
  engine.updateBounds(root.getBoundingClientRect(), {
    x: 0,
    y: 0,
    width: 250,
    height: 200,
  });
  const box = root.getBoundingClientRect();
  const mouse = (type: "mousePressed" | "mouseReleased") =>
    cdp().send("Input.dispatchMouseEvent", {
      type,
      x: box.left + 20,
      y: box.top + 20,
      button: "left",
      buttons: type === "mousePressed" ? 1 : 0,
      clickCount: 1,
    });
  return { engine, root, mouse, access: createInteractionAccess(chartStore) };
}

it
  .skipIf(!navigator.userAgent.includes("Chrome"))
  .each(["stream", "chart"] as const)(
  "nested %s cancellation revokes saved native controls and sibling drag acquisition",
  async (cancelScope) => {
    let cancel = true;
    let pointerId = -1;
    let prevented = false;
    const ended = vi.fn();
    const { root, mouse, access } = mount((engine) => [
      ({ signal }) => {
        if (signal.action !== InputAction.START) {
          return;
        }
        pointerId = signal.id;
        if (!cancel) {
          return;
        }
        const saved = signal.native;
        engine.input({
          ...signal,
          native: undefined,
          action: InputAction.CANCEL,
          cancelScope,
        });
        saved?.capturePointer();
        saved?.preventDefault();
      },
      DragSensor({ onDragEnd: ended }),
    ]);
    root.addEventListener("pointerdown", (event) => {
      prevented = event.defaultPrevented;
    });
    await mouse("mousePressed");
    try {
      expect(root.hasPointerCapture(pointerId)).toBe(false);
      expect(prevented).toBe(false);
      expect(access.getInteraction("drag")).toBeNull();
    } finally {
      await mouse("mouseReleased");
    }
    expect(ended).not.toHaveBeenCalled();
    cancel = false;
    await mouse("mousePressed");
    try {
      expect(root.hasPointerCapture(pointerId)).toBe(true);
    } finally {
      await mouse("mouseReleased");
    }
    expect(ended).toHaveBeenCalledOnce();
  },
);

it.skipIf(!navigator.userAgent.includes("Chrome"))(
  "dispose releases a captured drag and reactivation cannot commit its pending END",
  async () => {
    let signal: InputSignal | undefined;
    const ended = vi.fn();
    const { engine, root, mouse, access } = mount(() => [
      (event) => {
        if (event.signal.action === InputAction.START) {
          signal = event.signal;
        }
      },
      DragSensor({ onDragEnd: ended }),
    ]);
    await mouse("mousePressed");
    try {
      expect(root.hasPointerCapture(signal!.id)).toBe(true);
      engine.dispose();
      expect(root.hasPointerCapture(signal!.id)).toBe(false);
      expect(access.getInteraction("drag")).toBeNull();
      engine.activate();
    } finally {
      await mouse("mouseReleased");
    }
    expect(ended).not.toHaveBeenCalled();
    await mouse("mousePressed");
    try {
      expect(root.hasPointerCapture(signal!.id)).toBe(true);
    } finally {
      await mouse("mouseReleased");
    }
    expect(ended).toHaveBeenCalledOnce();
  },
);
