/**
 * Engine Core Unit Tests
 *
 * Tests for the Hyper-Engine architecture components.
 * These tests are DOM-independent where possible.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Engine } from "./Engine";
import { Scheduler } from "./Scheduler";
import { IndexedPoint, SpatialMap } from "./SpatialMap";
import {
  EngineEvent,
  InputAction,
  InputSignal,
  InputSource,
  TaskPriority,
} from "./types";

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Create a mock InputSignal for testing.
 */
function createMockSignal(overrides: Partial<InputSignal> = {}): InputSignal {
  return {
    id: 1,
    action: InputAction.MOVE,
    source: InputSource.MOUSE,
    x: 100,
    y: 100,
    timestamp: performance.now(),
    userId: "local",
    ...overrides,
  };
}

/**
 * Create mock indexed points for testing.
 */
function createMockPoints<T>(count: number): IndexedPoint<T>[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i * 50,
    y: i * 50,
    data: { value: i } as T,
    seriesId: "series-a",
    dataIndex: i,
  }));
}

// =============================================================================
// SCHEDULER TESTS
// =============================================================================

describe("Scheduler", () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
  });

  afterEach(() => {
    scheduler.dispose();
  });

  describe("Critical Priority", () => {
    it("should execute critical tasks synchronously", () => {
      const handler = vi.fn();
      scheduler.setHandler(handler);

      const event: EngineEvent = {
        signal: createMockSignal({ action: InputAction.START }),
        candidates: [],
        chartX: 100,
        chartY: 100,
        isWithinPlot: true,
      };

      scheduler.schedule(TaskPriority.CRITICAL, event);

      // Should be called immediately (synchronously)
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe("Visual Priority", () => {
    it("should batch visual tasks to animation frame", async () => {
      const handler = vi.fn();
      scheduler.setHandler(handler);

      const event1: EngineEvent = {
        signal: createMockSignal({ id: 1 }),
        candidates: [],
        chartX: 100,
        chartY: 100,
        isWithinPlot: true,
      };

      const event2: EngineEvent = {
        signal: createMockSignal({ id: 1 }),
        candidates: [],
        chartX: 150,
        chartY: 150,
        isWithinPlot: true,
      };

      scheduler.schedule(TaskPriority.VISUAL, event1);
      scheduler.schedule(TaskPriority.VISUAL, event2);

      // Not called yet (waiting for RAF)
      expect(handler).not.toHaveBeenCalled();

      // Wait for RAF
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Should coalesce: only the latest event per input ID
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event2);
    });

    it("should not coalesce events with different input IDs", async () => {
      const handler = vi.fn();
      scheduler.setHandler(handler);

      const event1: EngineEvent = {
        signal: createMockSignal({ id: 1 }),
        candidates: [],
        chartX: 100,
        chartY: 100,
        isWithinPlot: true,
      };

      const event2: EngineEvent = {
        signal: createMockSignal({ id: 2 }),
        candidates: [],
        chartX: 150,
        chartY: 150,
        isWithinPlot: true,
      };

      scheduler.schedule(TaskPriority.VISUAL, event1);
      scheduler.schedule(TaskPriority.VISUAL, event2);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Both should be dispatched
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("Dispose", () => {
    it("should cancel pending visual tasks on dispose", async () => {
      const handler = vi.fn();
      scheduler.setHandler(handler);

      const event: EngineEvent = {
        signal: createMockSignal(),
        candidates: [],
        chartX: 100,
        chartY: 100,
        isWithinPlot: true,
      };

      scheduler.schedule(TaskPriority.VISUAL, event);
      scheduler.dispose();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Should NOT have been called
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// SPATIAL MAP TESTS
// =============================================================================

describe("SpatialMap", () => {
  let spatialMap: SpatialMap;

  beforeEach(() => {
    // Disable DOM hit testing for unit tests
    spatialMap = new SpatialMap({ useDomHitTesting: false });
  });

  describe("Quadtree Queries", () => {
    it("should find points within magnetic radius", () => {
      const points = createMockPoints(5);
      spatialMap.updateIndex(points);

      // Query near point at (50, 50)
      const candidates = spatialMap.find(55, 55);

      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0].dataIndex).toBe(1);
      expect(candidates[0].type).toBe("data-point");
    });

    it("should return empty array when no points are within radius", () => {
      const points = createMockPoints(3);
      spatialMap.updateIndex(points);

      // Query far from any point
      const candidates = spatialMap.find(500, 500);

      expect(candidates).toEqual([]);
    });

    it("should sort candidates by distance", () => {
      // Use larger magnetic radius to catch multiple points
      const index = new SpatialMap({
        useDomHitTesting: false,
        magneticRadius: 50,
      });
      const points = createMockPoints(5);
      index.updateIndex(points);

      // Query between two points (at 50,50 and 100,100)
      const candidates = index.find(75, 75);

      // Should have at least 2 candidates
      expect(candidates.length).toBeGreaterThanOrEqual(2);

      // First candidate should be closer
      expect(candidates[0].distance).toBeLessThanOrEqual(
        candidates[1].distance,
      );
    });

    it("should respect custom magnetic radius", () => {
      const index = new SpatialMap({
        useDomHitTesting: false,
        magneticRadius: 10,
      });
      const points = createMockPoints(3);
      index.updateIndex(points);

      // Query 15px away from point at (50, 50) - outside radius
      const candidates = index.find(65, 50);

      expect(candidates).toEqual([]);
    });
  });

  describe("Index Management", () => {
    it("should clear the index", () => {
      const points = createMockPoints(5);
      spatialMap.updateIndex(points);
      spatialMap.clear();

      const candidates = spatialMap.find(50, 50);
      expect(candidates).toEqual([]);
    });

    it("should update the index with new points", () => {
      const points1 = createMockPoints(3);
      spatialMap.updateIndex(points1);

      const points2: IndexedPoint[] = [
        {
          x: 200,
          y: 200,
          data: { value: 99 },
          seriesId: "series-b",
          dataIndex: 0,
        },
      ];
      spatialMap.updateIndex(points2);

      // Old points should not be found
      const oldCandidates = spatialMap.find(50, 50);
      expect(oldCandidates).toEqual([]);

      // New point should be found
      const newCandidates = spatialMap.find(205, 205);
      expect(newCandidates.length).toBe(1);
      expect(newCandidates[0].seriesId).toBe("series-b");
    });
  });
});

// =============================================================================
// ENGINE TESTS
// =============================================================================

describe("Engine", () => {
  let engine: Engine;
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn();
    engine = new Engine({
      useDomHitTesting: false,
      onEvent: handler as any,
    });
  });

  afterEach(() => {
    engine.dispose();
  });

  describe("Input Processing", () => {
    it("should process input signals and dispatch events", () => {
      const signal = createMockSignal({ action: InputAction.START });

      engine.input(signal);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signal,
          candidates: [],
        }),
      );
    });

    it("should find candidates from spatial map", () => {
      const points = createMockPoints(3);
      engine.updateData(points);

      // Use START action for synchronous execution
      const signal = createMockSignal({
        x: 55,
        y: 55,
        action: InputAction.START,
      });
      engine.input(signal);

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0] as EngineEvent;
      expect(event.candidates.length).toBeGreaterThan(0);
    });

    it("should not process inputs after dispose", () => {
      engine.dispose();

      const signal = createMockSignal();
      engine.input(signal);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Coordinate Calculation", () => {
    it("should calculate chart coordinates relative to plot bounds", () => {
      engine.setContainer(null, null, {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
      });

      const signal = createMockSignal({
        x: 100,
        y: 100,
        action: InputAction.START,
      });
      engine.input(signal);

      const event = handler.mock.calls[0][0] as EngineEvent;
      expect(event.chartX).toBe(50); // 100 - 50
      expect(event.chartY).toBe(50); // 100 - 50
      expect(event.isWithinPlot).toBe(true);
    });

    it("should detect when pointer is outside plot bounds", () => {
      engine.setContainer(null, null, {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      });

      const signal = createMockSignal({
        x: 200,
        y: 200,
        action: InputAction.START,
      });
      engine.input(signal);

      const event = handler.mock.calls[0][0] as EngineEvent;
      expect(event.isWithinPlot).toBe(false);
    });
  });

  describe("Priority Scheduling", () => {
    it("should schedule START events as CRITICAL (synchronous)", () => {
      const signal = createMockSignal({ action: InputAction.START });
      engine.input(signal);

      // Should be called immediately
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should schedule MOVE events as VISUAL (batched)", async () => {
      const signal = createMockSignal({ action: InputAction.MOVE });
      engine.input(signal);

      // Should NOT be called immediately
      expect(handler).not.toHaveBeenCalled();

      // Wait for RAF
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Lifecycle", () => {
    it("should report disposed state correctly", () => {
      expect(engine.isDisposed()).toBe(false);

      engine.dispose();

      expect(engine.isDisposed()).toBe(true);
    });

    it("should handle multiple dispose calls gracefully", () => {
      engine.dispose();
      engine.dispose(); // Should not throw

      expect(engine.isDisposed()).toBe(true);
    });
  });

  describe("setHandler", () => {
    it("should allow replacing the event handler", () => {
      const newHandler = vi.fn();
      engine.setHandler(newHandler);

      const signal = createMockSignal({ action: InputAction.START });
      engine.input(signal);

      expect(handler).not.toHaveBeenCalled();
      expect(newHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateBounds", () => {
    it("should update plot bounds for coordinate calculations", () => {
      // Set initial bounds
      engine.setContainer(null, null, { x: 0, y: 0, width: 100, height: 100 });

      // Update to new bounds
      const newRect = new DOMRect(0, 0, 400, 300);
      engine.updateBounds(newRect, { x: 100, y: 50, width: 200, height: 150 });

      const signal = createMockSignal({
        x: 150,
        y: 100,
        action: InputAction.START,
      });
      engine.input(signal);

      const event = handler.mock.calls[0][0] as EngineEvent;
      expect(event.chartX).toBe(50); // 150 - 100
      expect(event.chartY).toBe(50); // 100 - 50
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data gracefully", () => {
      engine.updateData([]);

      const signal = createMockSignal({ action: InputAction.START });
      engine.input(signal);

      const event = handler.mock.calls[0][0] as EngineEvent;
      expect(event.candidates).toEqual([]);
    });

    it("should handle negative coordinates", () => {
      engine.setContainer(null, null, {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
      });

      const signal = createMockSignal({
        x: -10,
        y: -10,
        action: InputAction.START,
      });
      engine.input(signal);

      const event = handler.mock.calls[0][0] as EngineEvent;
      expect(event.chartX).toBe(-60); // -10 - 50
      expect(event.chartY).toBe(-60);
      expect(event.isWithinPlot).toBe(false);
    });

    it("should work without plot bounds set", () => {
      // Don't set plot bounds
      const signal = createMockSignal({
        x: 100,
        y: 100,
        action: InputAction.START,
      });
      engine.input(signal);

      const event = handler.mock.calls[0][0] as EngineEvent;
      // Without plot bounds, chartX/Y should equal container coords
      expect(event.chartX).toBe(100);
      expect(event.chartY).toBe(100);
      expect(event.isWithinPlot).toBe(true);
    });
  });
});

// =============================================================================
// SCHEDULER IDLE PRIORITY TESTS
// =============================================================================

describe("Scheduler IDLE Priority", () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
  });

  afterEach(() => {
    scheduler.dispose();
  });

  it("should defer idle tasks", async () => {
    const handler = vi.fn();
    scheduler.setHandler(handler);

    const event: EngineEvent = {
      signal: createMockSignal(),
      candidates: [],
      chartX: 100,
      chartY: 100,
      isWithinPlot: true,
    };

    scheduler.schedule(TaskPriority.IDLE, event);

    // Not called immediately
    expect(handler).not.toHaveBeenCalled();

    // Wait for idle callback (or setTimeout fallback)
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// CREATE SIGNAL TESTS
// =============================================================================

describe("Engine.createSignal", () => {
  let engine: Engine;

  beforeEach(() => {
    engine = new Engine({ useDomHitTesting: false });
    // Must set container for createSignal to work
    const mockElement = {
      getBoundingClientRect: () => new DOMRect(100, 50, 400, 300),
    } as Element;
    engine.setContainer(mockElement);
  });

  afterEach(() => {
    engine.dispose();
  });

  it("should return null if container is not set", () => {
    const newEngine = new Engine({ useDomHitTesting: false });
    const mockEvent = new MouseEvent("mousedown", {
      clientX: 200,
      clientY: 150,
    });

    const signal = newEngine.createSignal(mockEvent, InputAction.START);

    expect(signal).toBeNull();
    newEngine.dispose();
  });

  it("should convert MouseEvent to InputSignal", () => {
    const mockEvent = new MouseEvent("mousedown", {
      clientX: 200,
      clientY: 150,
      shiftKey: true,
    });

    const signal = engine.createSignal(mockEvent, InputAction.START);

    expect(signal).not.toBeNull();
    expect(signal!.action).toBe(InputAction.START);
    expect(signal!.source).toBe(InputSource.MOUSE);
    expect(signal!.x).toBe(100); // 200 - 100 (container left)
    expect(signal!.y).toBe(100); // 150 - 50 (container top)
    expect(signal!.userId).toBe("local");
    expect(signal!.modifiers?.shift).toBe(true);
  });

  it("should detect touch source from PointerEvent", () => {
    const mockEvent = new PointerEvent("pointerdown", {
      clientX: 200,
      clientY: 150,
      pointerType: "touch",
      pointerId: 42,
    });

    const signal = engine.createSignal(mockEvent, InputAction.START);

    expect(signal!.source).toBe(InputSource.TOUCH);
    expect(signal!.id).toBe(42);
  });

  it("should allow custom userId for multiplayer", () => {
    const mockEvent = new MouseEvent("mousedown", {
      clientX: 200,
      clientY: 150,
    });

    const signal = engine.createSignal(
      mockEvent,
      InputAction.START,
      "player-2",
    );

    expect(signal!.userId).toBe("player-2");
  });
});

// =============================================================================
// CREATE KEY SIGNAL TESTS
// =============================================================================

describe("Engine.createKeySignal", () => {
  let engine: Engine;

  beforeEach(() => {
    engine = new Engine({ useDomHitTesting: false });
  });

  afterEach(() => {
    engine.dispose();
  });

  it("should convert KeyboardEvent to InputSignal", () => {
    const mockEvent = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      shiftKey: true,
      ctrlKey: false,
    });

    const signal = engine.createKeySignal(mockEvent);

    expect(signal.action).toBe(InputAction.KEY);
    expect(signal.source).toBe(InputSource.KEYBOARD);
    expect(signal.key).toBe("ArrowRight");
    expect(signal.x).toBe(0);
    expect(signal.y).toBe(0);
    expect(signal.modifiers?.shift).toBe(true);
    expect(signal.modifiers?.ctrl).toBe(false);
  });

  it("should allow custom userId", () => {
    const mockEvent = new KeyboardEvent("keydown", { key: "Enter" });

    const signal = engine.createKeySignal(mockEvent, "remote-user");

    expect(signal.userId).toBe("remote-user");
  });
});

// =============================================================================
// SPATIAL MAP EDGE CASES
// =============================================================================

describe("SpatialMap Edge Cases", () => {
  it("should handle single point at origin", () => {
    const map = new SpatialMap({ useDomHitTesting: false });
    map.updateIndex([
      { x: 0, y: 0, data: { value: 0 }, seriesId: "a", dataIndex: 0 },
    ]);

    const candidates = map.find(5, 5);

    expect(candidates.length).toBe(1);
    expect(candidates[0].dataIndex).toBe(0);
  });

  it("should handle duplicate points at same location", () => {
    const map = new SpatialMap({ useDomHitTesting: false });
    map.updateIndex([
      { x: 50, y: 50, data: { value: 1 }, seriesId: "a", dataIndex: 0 },
      { x: 50, y: 50, data: { value: 2 }, seriesId: "a", dataIndex: 1 },
    ]);

    const candidates = map.find(50, 50);

    expect(candidates.length).toBe(2);
  });

  it("should preserve data properties in candidates", () => {
    const map = new SpatialMap({ useDomHitTesting: false });
    map.updateIndex([
      {
        x: 100,
        y: 100,
        data: { label: "Test", value: 42 },
        seriesId: "series-x",
        dataIndex: 5,
        draggable: true,
        suppressMarker: true,
      },
    ]);

    const candidates = map.find(100, 100);

    expect(candidates[0].data).toEqual({ label: "Test", value: 42 });
    expect(candidates[0].seriesId).toBe("series-x");
    expect(candidates[0].dataIndex).toBe(5);
    expect(candidates[0].draggable).toBe(true);
    expect(candidates[0].suppressMarker).toBe(true);
  });
});
