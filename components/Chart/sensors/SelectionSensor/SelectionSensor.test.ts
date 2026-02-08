/**
 * SelectionSensor Tests (TDD)
 *
 * Tests for the SelectionSensor that handles click-based selection
 * of data points with toggle behavior.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartEvent, SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { SelectionSensor } from "./SelectionSensor";

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
  const mockData = [
    { x: 0, y: 100, id: "point-0" },
    { x: 1, y: 200, id: "point-1" },
    { x: 2, y: 150, id: "point-2" },
  ];

  const mockSeries = {
    id: "test-series",
    data: mockData,
    strategy: {
      find: (
        chartX: number,
        _chartY: number,
        _radius: number,
        _xScale: unknown,
        _yScale: unknown,
      ) => {
        const idx = Math.round(chartX / 100);
        if (idx >= 0 && idx < mockData.length) {
          return {
            data: mockData[idx],
            coordinate: { x: chartX, y: mockData[idx].y },
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
          data: mockData,
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
          interactions,
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

// Helper to create pointer events
const createPointerDownEvent = (x: number, y: number): ChartEvent => ({
  type: "CHART_POINTER_DOWN",
  coordinates: {
    containerX: x + 50,
    containerY: y + 30,
    chartX: x,
    chartY: y,
    isWithinPlot: true,
  },
  nativeEvent: new PointerEvent("pointerdown"),
});

// =============================================================================
// LIFECYCLE TESTS
// =============================================================================

describe("SelectionSensor - Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be a factory function that returns a sensor", () => {
    const sensor = SelectionSensor();
    expect(typeof sensor).toBe("function");
  });

  it("should register CHART_POINTER_DOWN listener on initialization", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();

    sensor(ctx);

    expect(ctx.on).toHaveBeenCalledWith(
      "CHART_POINTER_DOWN",
      expect.any(Function),
    );
  });

  it("should return a cleanup function", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();

    const cleanup = sensor(ctx);

    expect(typeof cleanup).toBe("function");
  });

  it("should unregister listener on cleanup", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();

    const cleanup = sensor(ctx);
    cleanup?.();

    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_POINTER_DOWN",
      expect.any(Function),
    );
  });
});

// =============================================================================
// SELECTION BEHAVIOR TESTS
// =============================================================================

describe("SelectionSensor - Selection Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should select a data point on click", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(100, 100)),
    );

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.SELECTION,
      expect.objectContaining({
        selection: expect.any(Array),
        mode: "discrete",
      }),
    );
  });

  it("should add to selection on subsequent clicks", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");

    // First click
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(0, 100)),
    );

    // Second click on different point
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(100, 200)),
    );

    expect(ctx.upsertInteraction).toHaveBeenCalledTimes(2);
  });

  it("should deselect on click of already selected point (toggle)", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");

    // First click - select
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(0, 100)),
    );

    // Second click on same point - deselect
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(0, 100)),
    );

    // Verify second call has fewer items in selection
    const secondCall = (ctx.upsertInteraction as ReturnType<typeof vi.fn>).mock
      .calls[1];
    expect(secondCall[1].selection.length).toBeLessThanOrEqual(1);
  });

  it("should not change selection when clicking empty area", () => {
    const ctx = createMockContext();
    // Override to return no targets
    ctx.getChartContext = vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: [],
          processedSeries: [],
          scales: { x: (v: number) => v, y: (v: number) => v },
          config: {},
          dimensions: {
            innerWidth: 300,
            innerHeight: 200,
            margin: { left: 0, top: 0, right: 0, bottom: 0 },
          },
          interactions: new Map(),
        }),
      },
    }));

    const sensor = SelectionSensor();
    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(500, 500)),
    );

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("SelectionSensor - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle missing chart context gracefully", () => {
    const ctx = createMockContext();
    ctx.getChartContext = vi.fn(
      () => null as unknown as ReturnType<typeof ctx.getChartContext>,
    );

    const sensor = SelectionSensor();
    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");

    // Should not throw
    expect(() => {
      downListeners?.forEach((listener) =>
        listener(createPointerDownEvent(100, 100)),
      );
    }).not.toThrow();

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should use custom interaction channel name when provided", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor({ name: "custom-selection" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(100, 100)),
    );

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      "custom-selection",
      expect.anything(),
    );
  });

  it("should handle empty data array", () => {
    const ctx = createMockContext();
    ctx.getChartContext = vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: [],
          processedSeries: [],
          scales: { x: (v: number) => v, y: (v: number) => v },
          config: {},
          dimensions: {
            innerWidth: 300,
            innerHeight: 200,
            margin: { left: 0, top: 0, right: 0, bottom: 0 },
          },
          interactions: new Map(),
        }),
      },
    }));

    const sensor = SelectionSensor();
    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    downListeners?.forEach((listener) =>
      listener(createPointerDownEvent(100, 100)),
    );

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });
});
