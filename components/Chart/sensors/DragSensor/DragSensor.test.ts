/**
 * DragSensor Tests (TDD)
 *
 * Tests for the DragSensor that enables dragging data points
 * and tracks drag state through pointer events.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartEvent, SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { DragSensor } from "./DragSensor";

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
            x: Object.assign((v: number) => v * 100, {
              invert: (px: number) => px / 100,
            }),
            y: Object.assign((v: number) => 300 - v, {
              invert: (px: number) => 300 - px,
            }),
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
const createPointerEvent = (
  type: string,
  x: number,
  y: number,
): ChartEvent => ({
  type: type as ChartEvent["type"],
  coordinates: {
    containerX: x + 50,
    containerY: y + 30,
    chartX: x,
    chartY: y,
    isWithinPlot: true,
  },
  nativeEvent: new PointerEvent(
    type.replace("CHART_POINTER_", "").toLowerCase(),
  ),
});

// =============================================================================
// LIFECYCLE TESTS
// =============================================================================

describe("DragSensor - Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be a factory function that returns a sensor", () => {
    const sensor = DragSensor();
    expect(typeof sensor).toBe("function");
  });

  it("should register all pointer event listeners on initialization", () => {
    const ctx = createMockContext();
    const sensor = DragSensor();

    sensor(ctx);

    expect(ctx.on).toHaveBeenCalledWith(
      "CHART_POINTER_DOWN",
      expect.any(Function),
    );
    expect(ctx.on).toHaveBeenCalledWith(
      "CHART_POINTER_MOVE",
      expect.any(Function),
    );
    expect(ctx.on).toHaveBeenCalledWith(
      "CHART_POINTER_UP",
      expect.any(Function),
    );
    expect(ctx.on).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });

  it("should return a cleanup function", () => {
    const ctx = createMockContext();
    const sensor = DragSensor();

    const cleanup = sensor(ctx);

    expect(typeof cleanup).toBe("function");
  });

  it("should unregister all listeners on cleanup", () => {
    const ctx = createMockContext();
    const sensor = DragSensor();

    const cleanup = sensor(ctx);
    cleanup?.();

    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_POINTER_DOWN",
      expect.any(Function),
    );
    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_POINTER_MOVE",
      expect.any(Function),
    );
    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_POINTER_UP",
      expect.any(Function),
    );
    expect(ctx.off).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });
});

// =============================================================================
// DRAG BEHAVIOR TESTS
// =============================================================================

describe("DragSensor - Drag Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start drag on pointer down over a target", () => {
    const ctx = createMockContext();
    const sensor = DragSensor({ hitMode: "closest" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
    );

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.DRAG,
      expect.objectContaining({
        isDragging: true,
      }),
    );
  });

  it("should update position on pointer move during drag", () => {
    const ctx = createMockContext();
    const sensor = DragSensor({ hitMode: "closest" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    const moveListeners = ctx.listeners.get("CHART_POINTER_MOVE");

    // Start drag
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
    );

    // Move during drag
    moveListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_MOVE", 150, 120)),
    );

    // Should have called upsertInteraction twice (down + move)
    expect(ctx.upsertInteraction).toHaveBeenCalledTimes(2);

    // Second call should have updated position
    const secondCall = (ctx.upsertInteraction as ReturnType<typeof vi.fn>).mock
      .calls[1];
    expect(secondCall[1]).toMatchObject({
      currentPosition: { x: 150, y: 120 },
      isDragging: true,
    });
  });

  it("should end drag and remove interaction on pointer up", () => {
    const ctx = createMockContext();
    const sensor = DragSensor({ hitMode: "closest" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    const upListeners = ctx.listeners.get("CHART_POINTER_UP");

    // Start drag
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
    );

    // End drag
    upListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_UP", 150, 120)),
    );

    expect(ctx.removeInteraction).toHaveBeenCalledWith(InteractionChannel.DRAG);
  });

  it("should cancel drag on pointer leave", () => {
    const ctx = createMockContext();
    const sensor = DragSensor({ hitMode: "closest" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    const leaveListeners = ctx.listeners.get("CHART_POINTER_LEAVE");

    // Start drag
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
    );

    // Leave during drag
    leaveListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_LEAVE", 0, 0)),
    );

    expect(ctx.removeInteraction).toHaveBeenCalledWith(InteractionChannel.DRAG);
  });

  it("should not start drag when clicking on empty area", () => {
    const ctx = createMockContext();
    // Override to return empty targets
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

    const sensor = DragSensor({ hitMode: "closest" });
    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 500, 500)),
    );

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });
});

// =============================================================================
// CALLBACKS TESTS
// =============================================================================

describe("DragSensor - Callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call onDrag callback during drag", () => {
    const onDrag = vi.fn();
    const ctx = createMockContext();
    const sensor = DragSensor({ onDrag, hitMode: "closest" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    const moveListeners = ctx.listeners.get("CHART_POINTER_MOVE");

    // Start drag
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
    );

    // Move during drag
    moveListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_MOVE", 150, 120)),
    );

    expect(onDrag).toHaveBeenCalledWith(
      expect.anything(), // original data
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }), // current value
      expect.objectContaining({ x: 150, y: 120 }), // pixel position
    );
  });

  it("should call onDragEnd callback on drag end", () => {
    const onDragEnd = vi.fn();
    const ctx = createMockContext();
    const sensor = DragSensor({ onDragEnd, hitMode: "closest" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    const upListeners = ctx.listeners.get("CHART_POINTER_UP");

    // Start drag
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
    );

    // End drag
    upListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_UP", 200, 150)),
    );

    expect(onDragEnd).toHaveBeenCalledWith(
      expect.anything(), // original data
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }), // new value
      expect.objectContaining({ x: 200, y: 150 }), // pixel position
    );
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("DragSensor - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle missing chart context gracefully", () => {
    const ctx = createMockContext();
    ctx.getChartContext = vi.fn(
      () => null as unknown as ReturnType<typeof ctx.getChartContext>,
    );

    const sensor = DragSensor();
    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");

    // Should not throw
    expect(() => {
      downListeners?.forEach((listener) =>
        listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
      );
    }).not.toThrow();

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should use custom interaction channel name when provided", () => {
    const ctx = createMockContext();
    const sensor = DragSensor({ name: "custom-drag", hitMode: "closest" });

    sensor(ctx);

    const downListeners = ctx.listeners.get("CHART_POINTER_DOWN");
    const upListeners = ctx.listeners.get("CHART_POINTER_UP");

    // Start drag
    downListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_DOWN", 100, 100)),
    );

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      "custom-drag",
      expect.anything(),
    );

    // End drag
    upListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_UP", 150, 120)),
    );

    expect(ctx.removeInteraction).toHaveBeenCalledWith("custom-drag");
  });

  it("should ignore pointer move when not dragging", () => {
    const ctx = createMockContext();
    const sensor = DragSensor();

    sensor(ctx);

    const moveListeners = ctx.listeners.get("CHART_POINTER_MOVE");

    // Move without starting drag
    moveListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_MOVE", 150, 120)),
    );

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should ignore pointer up when not dragging", () => {
    const ctx = createMockContext();
    const sensor = DragSensor();

    sensor(ctx);

    const upListeners = ctx.listeners.get("CHART_POINTER_UP");

    // Up without starting drag
    upListeners?.forEach((listener) =>
      listener(createPointerEvent("CHART_POINTER_UP", 150, 120)),
    );

    expect(ctx.removeInteraction).not.toHaveBeenCalled();
  });
});
