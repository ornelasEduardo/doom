import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartContext } from "../../context";
import { Engine } from "../../engine";
import { DataHoverSensor } from "../../sensors/DataHoverSensor/DataHoverSensor";
import { KeyboardSensor } from "../../sensors/KeyboardSensor";
import { SensorManager } from "../../sensors/SensorManager/SensorManager";
import {
  createChartStore,
  updateChartState,
} from "../../state/store/chart.store";
import { ContextValue } from "../../types/context";
import { InteractionChannel } from "../../types/interaction";
import { InteractionLayer } from "./InteractionLayer";

afterEach(cleanup);

describe("synchronous keyboard handling", () => {
  it.each([
    "pointer-only",
    "empty",
    "offplot",
    "keyboard",
    "custom-channel",
    "duplicate",
  ])("cancels only an acknowledged selection: %s", (mode) => {
    const chartStore = createChartStore({}, "x", "y");
    const engine = new Engine();
    const keyboard = KeyboardSensor();
    const sensors =
      mode === "pointer-only"
        ? [DataHoverSensor()]
        : mode === "duplicate"
          ? [keyboard, keyboard]
          : [
              KeyboardSensor({
                name: mode === "custom-channel" ? "custom" : undefined,
              }),
            ];
    updateChartState(chartStore, {
      data:
        mode === "empty"
          ? []
          : [
              { x: 1, y: 12 },
              { x: 2, y: 18 },
              { x: 3, y: 24 },
            ],
      yDomain: mode === "offplot" ? [40, 50] : [0, 30],
      dimensions: {
        width: 200,
        height: 200,
        innerWidth: 160,
        innerHeight: 160,
        margin: { top: 20, bottom: 20, left: 20, right: 20 },
      },
    });
    const value = { chartStore, engine, config: {} } as ContextValue;
    const { unmount } = render(
      <ChartContext.Provider value={value}>
        <div data-chart-container tabIndex={0}>
          <InteractionLayer />
          <SensorManager {...{ sensors, value }} />
          <input aria-label="nested" />
        </div>
      </ChartContext.Provider>,
    );
    const root = document.querySelector("[data-chart-container]")!;
    const handled = mode !== "empty" && mode !== "offplot";
    expect(
      fireEvent.keyDown(root, { key: "ArrowDown", cancelable: true }),
    ).toBe(!handled);
    expect(
      chartStore
        .getState()
        .interactions.has(
          mode === "custom-channel"
            ? "custom"
            : InteractionChannel.PRIMARY_HOVER,
        ),
    ).toBe(handled);
    if (handled) {
      expect(
        chartStore
          .getState()
          .interactions.get(InteractionChannel.PRIMARY_HOVER),
      ).toMatchObject({ target: { dataIndex: 0 } });
      fireEvent.keyDown(root, { key: "ArrowDown" });
      expect(
        chartStore
          .getState()
          .interactions.get(InteractionChannel.PRIMARY_HOVER),
      ).toMatchObject({ target: { dataIndex: 1 } });
    }
    expect(
      fireEvent.keyDown(screen.getByRole("textbox"), {
        key: "ArrowDown",
        cancelable: true,
      }),
    ).toBe(true);
    unmount();
    engine.dispose();
  });
});
