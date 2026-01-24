import { describe, expect, it, vi } from "vitest";

import {
  removeInteraction,
  upsertInteraction,
} from "../../state/store/stores/interaction/interaction.store";
import { findNearestDataPoint } from "../../utils/interaction";
import { CartesianHover } from "./CartesianHover";

vi.mock("../../state/store/stores/interaction/interaction.store", () => ({
  upsertInteraction: vi.fn(),
  removeInteraction: vi.fn(),
}));

vi.mock("../../utils/interaction", () => ({
  findNearestDataPoint: vi.fn(),
  createScales: vi.fn().mockReturnValue({ xScale: vi.fn(), yScale: vi.fn() }),
  resolveAccessor: vi.fn().mockImplementation((fn) => fn),
}));

describe("CartesianHover", () => {
  it("registers event listeners", () => {
    const on = vi.fn();
    const off = vi.fn();
    const getChartContext = vi.fn();

    const behavior = CartesianHover();
    behavior({
      on,
      off,
      getChartContext,
      emit: vi.fn(),
      pointerPosition: {
        chartX: 0,
        chartY: 0,
        containerX: 0,
        containerY: 0,
        isWithinPlot: true,
      },
      isWithinPlot: true,
    });

    expect(on).toHaveBeenCalledWith("CHART_POINTER_MOVE", expect.any(Function));
    expect(on).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });

  it("deregisters event listeners on cleanup", () => {
    const on = vi.fn();
    const off = vi.fn();
    const getChartContext = vi.fn();

    const behavior = CartesianHover();
    const cleanup = behavior({
      on,
      off,
      getChartContext,
      emit: vi.fn(),
      pointerPosition: {
        chartX: 0,
        chartY: 0,
        containerX: 0,
        containerY: 0,
        isWithinPlot: true,
      },
      isWithinPlot: true,
    });

    cleanup();

    expect(off).toHaveBeenCalledWith(
      "CHART_POINTER_MOVE",
      expect.any(Function),
    );
    expect(off).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });

  it("updates hover state based on dataResolver", () => {
    const on = vi.fn();
    const interactionStore = { getState: vi.fn() };
    const getChartContext = vi.fn().mockReturnValue({
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ],
      width: 100,
      height: 100,
      config: {
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        type: "line",
      },
      x: (d: any) => d.x,
      y: (d: any) => d.y,
      interactionStore,
      seriesStore: {
        getState: () => ({ processedSeries: [] }),
      },
    });

    const behavior = CartesianHover({
      // Only snap to points with y > 15
      dataResolver: (d: any) => d.y > 15,
    });

    behavior({
      on,
      off: vi.fn(),
      getChartContext,
      emit: vi.fn(),
      pointerPosition: {
        chartX: 0,
        chartY: 0,
        containerX: 0,
        containerY: 0,
        isWithinPlot: true,
      },
      isWithinPlot: true,
    });

    const moveCall = on.mock.calls.find(
      (call) => call[0] === "CHART_POINTER_MOVE",
    );
    expect(moveCall).toBeDefined();
    const handleMove = moveCall![1];

    // Case 1: Resolver returns TRUE (should set hover state)
    const mockDataPoint = { x: 2, y: 20 };
    (findNearestDataPoint as any).mockReturnValue(mockDataPoint);

    handleMove({
      nativeEvent: new MouseEvent("mousemove"),
      coordinates: {
        chartX: 50,
        chartY: 50,
        containerX: 60,
        containerY: 60,
        isWithinPlot: true,
      },
    } as any);

    expect(upsertInteraction).toHaveBeenCalledWith(
      interactionStore,
      "hover",
      expect.objectContaining({
        target: expect.objectContaining({
          data: mockDataPoint,
        }),
      }),
    );

    // Case 2: Resolver returns FALSE (should CLEAR hover state)
    vi.mocked(removeInteraction).mockClear();
    // y=10 is <= 15, should fail resolver
    (findNearestDataPoint as any).mockReturnValue({ x: 1, y: 10 });

    handleMove({
      nativeEvent: new MouseEvent("mousemove"),
      coordinates: {
        chartX: 52,
        chartY: 52,
        containerX: 62,
        containerY: 62,
        isWithinPlot: true,
      },
    } as any);

    expect(removeInteraction).toHaveBeenCalledWith(interactionStore, "hover");
  });
});
