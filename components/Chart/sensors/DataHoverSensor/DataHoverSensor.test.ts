/**
 * DataHoverSensor Tests (TDD - RED PHASE)
 *
 * Tests for the DataHoverSensor that detects pointer movements
 * and identifies closest data targets.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartEvent, SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { DataHoverSensor } from "./DataHoverSensor";

// =============================================================================
// MOCK SETUP
// =============================================================================

const createMockContext = (): SensorContext & {
  listeners: Map<string, Set<(event: ChartEvent) => void>>;
  interactions: Map<string, unknown>;
} => {
  const listeners = new Map<string, Set<(event: ChartEvent) => void>>();
  const interactions = new Map<string, unknown>();

  // Mock series with a find strategy
  const mockSeries = {
    id: "test-series",
    data: [
      { x: 0, y: 100 },
      { x: 1, y: 200 },
      { x: 2, y: 150 },
    ],
    strategy: {
      find: (
        chartX: number,
        _chartY: number,
        _radius: number,
        _xScale: unknown,
        _yScale: unknown,
      ) => {
        // Return a mock target near 50px
        if (chartX >= 0 && chartX <= 100) {
          return {
            data: { x: 0, y: 100 },
            coordinate: { x: chartX, y: 100 },
            seriesId: "test-series",
          };
        }
        return null;
      },
    },
  };

  return {
    listeners,
    interactions,
    on: vi.fn((type: string, listener: (event: ChartEvent) => void) => {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)!.add(listener);
    }),
    off: vi.fn((type: string, listener: (event: ChartEvent) => void) => {
      listeners.get(type)?.delete(listener);
    }),
    getChartContext: vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: [
            { x: 0, y: 100 },
            { x: 1, y: 200 },
            { x: 2, y: 150 },
          ],
          processedSeries: [mockSeries],
          scales: {
            x: (v: number) => v * 100,
            y: (v: number) => 300 - v,
          },
          config: {
            x: (d: { x: number }) => d.x,
            y: (d: { y: number }) => d.y,
          },
          dimensions: {
            innerWidth: 300,
            innerHeight: 200,
            margin: { left: 50, top: 30, right: 20, bottom: 40 },
          },
        }),
      },
    })),
    getInteraction: vi.fn((name: string) => interactions.get(name) || null),
    upsertInteraction: vi.fn((name: string, interaction: unknown) => {
      interactions.set(name, interaction);
    }),
    removeInteraction: vi.fn((name: string) => {
      interactions.delete(name);
    }),
    emit: vi.fn(),
    pointerPosition: null,
    isWithinPlot: false,
  };
};

// =============================================================================
// LIFECYCLE TESTS
// =============================================================================

describe("DataHoverSensor - Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be a factory function that returns a sensor", () => {
    const sensor = DataHoverSensor();
    expect(typeof sensor).toBe("function");
  });

  it("should register event listeners on initialization", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();

    sensor(ctx);

    expect(ctx.on).toHaveBeenCalledWith(
      "CHART_POINTER_MOVE",
      expect.any(Function),
    );
    expect(ctx.on).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });

  it("should return a cleanup function", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();

    const cleanup = sensor(ctx);

    expect(typeof cleanup).toBe("function");
  });

  it("should unregister listeners on cleanup", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();

    const cleanup = sensor(ctx);
    cleanup?.();

    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_POINTER_MOVE",
      expect.any(Function),
    );
    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });
});

// =============================================================================
// HOVER BEHAVIOR TESTS
// =============================================================================

describe("DataHoverSensor - Hover Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upsert interaction when pointer moves over data", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();

    sensor(ctx);

    // Simulate a pointer move event
    const moveEvent: ChartEvent = {
      type: "CHART_POINTER_MOVE",
      coordinates: {
        containerX: 100,
        containerY: 100,
        chartX: 50,
        chartY: 50,
        isWithinPlot: true,
      },
      nativeEvent: new PointerEvent("pointermove"),
    };

    // Fire the registered listener
    const moveListeners = ctx.listeners.get("CHART_POINTER_MOVE");
    moveListeners?.forEach((listener) => listener(moveEvent));

    // Should have called upsertInteraction
    expect(ctx.upsertInteraction).toHaveBeenCalled();
  });

  it("should remove interaction when pointer leaves", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();

    sensor(ctx);

    // Fire leave event
    const leaveEvent: ChartEvent = {
      type: "CHART_POINTER_LEAVE",
      coordinates: {
        containerX: 0,
        containerY: 0,
        chartX: 0,
        chartY: 0,
        isWithinPlot: false,
      },
      nativeEvent: new PointerEvent("pointerleave"),
    };

    const leaveListeners = ctx.listeners.get("CHART_POINTER_LEAVE");
    leaveListeners?.forEach((listener) => listener(leaveEvent));

    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
  });

  it("should use custom interaction channel name when provided", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor({ mode: "nearest-x", name: "custom-hover" });

    sensor(ctx);

    // Fire leave to check the channel name
    const leaveEvent: ChartEvent = {
      type: "CHART_POINTER_LEAVE",
      coordinates: {
        containerX: 0,
        containerY: 0,
        chartX: 0,
        chartY: 0,
        isWithinPlot: false,
      },
      nativeEvent: new PointerEvent("pointerleave"),
    };

    const leaveListeners = ctx.listeners.get("CHART_POINTER_LEAVE");
    leaveListeners?.forEach((listener) => listener(leaveEvent));

    expect(ctx.removeInteraction).toHaveBeenCalledWith("custom-hover");
  });
});

// =============================================================================
// MODE TESTS
// =============================================================================

describe("DataHoverSensor - Modes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept 'nearest-x' mode (default)", () => {
    const sensor = DataHoverSensor({ mode: "nearest-x" });
    expect(typeof sensor).toBe("function");
  });

  it("should accept 'nearest' mode", () => {
    const sensor = DataHoverSensor({ mode: "nearest" });
    expect(typeof sensor).toBe("function");
  });

  it("should accept 'exact' mode", () => {
    const sensor = DataHoverSensor({ mode: "exact" });
    expect(typeof sensor).toBe("function");
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("DataHoverSensor - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle missing chart context gracefully", () => {
    const ctx = createMockContext();
    ctx.getChartContext = vi.fn(
      () => null as unknown as ReturnType<typeof ctx.getChartContext>,
    );

    const sensor = DataHoverSensor();
    sensor(ctx);

    const moveEvent: ChartEvent = {
      type: "CHART_POINTER_MOVE",
      coordinates: {
        containerX: 100,
        containerY: 100,
        chartX: 50,
        chartY: 50,
        isWithinPlot: true,
      },
      nativeEvent: new PointerEvent("pointermove"),
    };

    const moveListeners = ctx.listeners.get("CHART_POINTER_MOVE");

    // Should not throw
    expect(() => {
      moveListeners?.forEach((listener) => listener(moveEvent));
    }).not.toThrow();

    // Should not have called upsertInteraction
    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should handle empty data array", () => {
    const ctx = createMockContext();
    ctx.getChartContext = vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: [],
          processedSeries: [], // Empty series - no targets to find
          scales: { x: (v: number) => v, y: (v: number) => v },
          config: {},
          dimensions: {
            innerWidth: 300,
            innerHeight: 200,
            margin: { left: 0, top: 0, right: 0, bottom: 0 },
          },
        }),
      },
    }));

    const sensor = DataHoverSensor();
    sensor(ctx);

    const moveEvent: ChartEvent = {
      type: "CHART_POINTER_MOVE",
      coordinates: {
        containerX: 100,
        containerY: 100,
        chartX: 50,
        chartY: 50,
        isWithinPlot: true,
      },
      nativeEvent: new PointerEvent("pointermove"),
    };

    const moveListeners = ctx.listeners.get("CHART_POINTER_MOVE");
    moveListeners?.forEach((listener) => listener(moveEvent));

    // Should call removeInteraction since no targets found
    expect(ctx.removeInteraction).toHaveBeenCalled();
  });
});
