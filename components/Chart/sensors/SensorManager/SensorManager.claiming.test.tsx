import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { Engine, InputAction, InputSource } from "../../engine";
import { createChartStore } from "../../state/store/chart.store";
import type { ContextValue, Sensor } from "../../types";
import { SensorManager } from "./SensorManager";

const { baseline } = vi.hoisted(() => ({ baseline: vi.fn() }));
vi.mock("../KeyboardSensor", () => ({ KeyboardSensor: () => baseline }));
afterEach(() => {
  cleanup();
  baseline.mockClear();
});

it.each([false, true])(
  "dispatches baseline only when keyboard intent is unclaimed (claimed=%s)",
  (claimed) => {
    const store = createChartStore<number>({ type: "line" });
    store.setState({ status: "ready", data: [1] });
    const engine = new Engine<number>();
    const context: ContextValue<number> = {
      chartStore: store,
      engine,
      config: { type: "line" },
      colorPalette: [],
      styles: {},
      isMobile: false,
      resolveInteraction: () => null,
    };
    const sensor: Sensor<number> = (event) => {
      event.claimed = claimed;
      event.handled = true;
    };
    render(<SensorManager sensors={[sensor]} value={context} />);
    engine.input({
      id: 1,
      action: InputAction.KEY,
      source: InputSource.KEYBOARD,
      x: 0,
      y: 0,
      timestamp: 0,
      userId: "local",
      key: "ArrowRight",
      keyPhase: "down",
    });
    expect(baseline).toHaveBeenCalledTimes(claimed ? 0 : 1);
    engine.dispose();
  },
);
