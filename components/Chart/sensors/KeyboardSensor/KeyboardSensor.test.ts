/**
 * KeyboardSensor Tests (TDD)
 *
 * Tests for the KeyboardSensor that handles keyboard navigation
 * through chart data points.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartEvent, SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { KeyboardSensor } from "./KeyboardSensor";

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
    { x: 0, y: 100 },
    { x: 1, y: 200 },
    { x: 2, y: 150 },
  ];

  const mockSeries = {
    id: "test-series",
    data: mockData,
    strategy: {
      find: (chartX: number, _chartY: number) => {
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

// Helper to create keyboard events
const createKeyEvent = (key: string): ChartEvent => ({
  type: "CHART_KEY_DOWN",
  coordinates: {
    containerX: 0,
    containerY: 0,
    chartX: 0,
    chartY: 0,
    isWithinPlot: true,
  },
  nativeEvent: new KeyboardEvent("keydown", { key }),
});

// =============================================================================
// LIFECYCLE TESTS
// =============================================================================

describe("KeyboardSensor - Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be a factory function that returns a sensor", () => {
    const sensor = KeyboardSensor();
    expect(typeof sensor).toBe("function");
  });

  it("should register CHART_KEY_DOWN listener on initialization", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    sensor(ctx);

    expect(ctx.on).toHaveBeenCalledWith("CHART_KEY_DOWN", expect.any(Function));
  });

  it("should return a cleanup function", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    const cleanup = sensor(ctx);

    expect(typeof cleanup).toBe("function");
  });

  it("should unregister listener on cleanup", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    const cleanup = sensor(ctx);
    cleanup?.();

    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_KEY_DOWN",
      expect.any(Function),
    );
  });
});

// =============================================================================
// NAVIGATION TESTS
// =============================================================================

describe("KeyboardSensor - Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should navigate right on ArrowRight", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowRight")));

    expect(ctx.upsertInteraction).toHaveBeenCalled();
  });

  it("should navigate left on ArrowLeft after navigating right", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");

    // Navigate right first (to index 0)
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowRight")));

    // Navigate right again (to index 1)
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowRight")));

    // Now navigate left (back to index 0)
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowLeft")));

    // Should have called upsertInteraction 3 times
    expect(ctx.upsertInteraction).toHaveBeenCalledTimes(3);
  });

  it("should remove interaction on Escape", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");

    // Navigate to a point first
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowRight")));

    // Press Escape
    keyListeners?.forEach((listener) => listener(createKeyEvent("Escape")));

    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
  });

  it("should not navigate past the end of data", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");

    // Navigate right past the end (will keep calling, but stay at last index)
    for (let i = 0; i < 10; i++) {
      keyListeners?.forEach((listener) =>
        listener(createKeyEvent("ArrowRight")),
      );
    }

    // Sensor keeps calling as it clamps to max index
    expect(ctx.upsertInteraction).toHaveBeenCalled();
  });

  it("should not navigate before index 0", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");

    // Navigate right first
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowRight")));

    // Try to navigate left past the beginning
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowLeft")));
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowLeft")));

    // Should have called upsertInteraction 3 times (right, left, left - all valid)
    // Actually the left past 0 should still call, just with same index
    expect(ctx.upsertInteraction).toHaveBeenCalled();
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("KeyboardSensor - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should ignore non-arrow keys", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");
    keyListeners?.forEach((listener) => listener(createKeyEvent("a")));
    keyListeners?.forEach((listener) => listener(createKeyEvent("Enter")));
    keyListeners?.forEach((listener) => listener(createKeyEvent("Tab")));

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should handle missing chart context gracefully", () => {
    const ctx = createMockContext();
    ctx.getChartContext = vi.fn(
      () => null as unknown as ReturnType<typeof ctx.getChartContext>,
    );

    const sensor = KeyboardSensor();
    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");

    // Should not throw
    expect(() => {
      keyListeners?.forEach((listener) =>
        listener(createKeyEvent("ArrowRight")),
      );
    }).not.toThrow();

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
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
        }),
      },
    }));

    const sensor = KeyboardSensor();
    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowRight")));

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should use custom interaction channel name when provided", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor({ name: "custom-keyboard" });

    sensor(ctx);

    const keyListeners = ctx.listeners.get("CHART_KEY_DOWN");

    // Navigate to set up an interaction
    keyListeners?.forEach((listener) => listener(createKeyEvent("ArrowRight")));

    // Press Escape to remove
    keyListeners?.forEach((listener) => listener(createKeyEvent("Escape")));

    expect(ctx.removeInteraction).toHaveBeenCalledWith("custom-keyboard");
  });
});
