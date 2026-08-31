/**
 * The extension API is documented in chart.md and typed into Props.sensors /
 * Props.behaviors, so it has to be reachable from the package entry. These
 * assertions are the contract a consumer depends on.
 */
import { describe, expect, it } from "vitest";

import { Chart, InputAction, InputSource, InteractionChannel } from "./index";

describe("Chart public extension API", () => {
  it("exposes the built-in sensors", () => {
    expect(typeof Chart.sensors.DataHoverSensor).toBe("function");
    expect(typeof Chart.sensors.KeyboardSensor).toBe("function");
    expect(typeof Chart.sensors.DragSensor).toBe("function");
    expect(typeof Chart.sensors.SelectionSensor).toBe("function");
  });

  it("exposes the built-in behaviors", () => {
    expect(typeof Chart.behaviors.Tooltip).toBe("function");
    expect(typeof Chart.behaviors.Cursor).toBe("function");
    expect(typeof Chart.behaviors.Markers).toBe("function");
    expect(typeof Chart.behaviors.Dim).toBe("function");
  });

  it("exposes the enums a custom sensor is written against", () => {
    expect(InputAction.MOVE).toBeDefined();
    expect(InputAction.KEY).toBeDefined();
    expect(InputSource.KEYBOARD).toBeDefined();
    expect(InteractionChannel.PRIMARY_HOVER).toBe("primary-hover");
  });
});
