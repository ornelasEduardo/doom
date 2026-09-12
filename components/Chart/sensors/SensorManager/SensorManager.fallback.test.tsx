import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { Engine, InputAction, InputSource } from "../../engine";
import {
  createChartStore,
  updateChartData,
  updateChartDimensions,
} from "../../state/store/chart.store";
import type { ContextValue, Sensor } from "../../types";
import { createInteractionAccess } from "../../utils/interactionChannels";
import { KeyboardSensor } from "../KeyboardSensor";
import { SensorManager } from "./SensorManager";

afterEach(cleanup);

it.each([false, true])(
  "real keyboard fallback respects claimed intent (claimed=%s)",
  (claimed) => {
    const chartStore = createChartStore<number>(
      { type: "line" },
      (value) => value,
      (value) => value,
    );
    updateChartDimensions(chartStore, 500, 300);
    updateChartData(chartStore, [1, 2]);
    const engine = new Engine<number>();
    const value: ContextValue<number> = {
      chartStore,
      engine,
      config: { type: "line" },
      colorPalette: [],
      styles: {},
      isMobile: false,
      resolveInteraction: () => null,
    };
    const claim: Sensor<number> = (event) => {
      event.claimed = claimed;
      event.handled = true;
    };
    render(<SensorManager sensors={[claim]} value={value} />);
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
    const hover =
      createInteractionAccess(chartStore).getInteraction("primary-hover");
    expect(hover?.target?.data ?? null).toBe(claimed ? null : 1);
    engine.dispose();
  },
);

it.each(["custom only", "primary first", "custom first"])(
  "keyboard channels advance once per key (%s)",
  (order) => {
    const chartStore = createChartStore<number>(
      { type: "line" },
      (value) => value,
      (value) => value,
    );
    updateChartDimensions(chartStore, 500, 300);
    updateChartData(chartStore, [1, 2]);
    const engine = new Engine<number>();
    const value: ContextValue<number> = {
      chartStore,
      engine,
      config: { type: "line" },
      colorPalette: [],
      styles: {},
      isMobile: false,
      resolveInteraction: () => null,
    };
    render(
      <SensorManager
        sensors={
          order === "custom only"
            ? [KeyboardSensor({ name: "custom-keyboard" })]
            : order === "primary first"
              ? [KeyboardSensor(), KeyboardSensor({ name: "custom-keyboard" })]
              : [KeyboardSensor({ name: "custom-keyboard" }), KeyboardSensor()]
        }
        value={value}
      />,
    );
    for (const expected of [1, 2]) {
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
      const access = createInteractionAccess(chartStore);
      expect(access.getInteraction("primary-hover")?.target?.data).toBe(
        expected,
      );
      expect(access.getInteraction("custom-keyboard")).toMatchObject({
        target: { data: expected },
      });
    }
    engine.dispose();
  },
);
