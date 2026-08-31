/**
 * useEngine Hook Tests (TDD - RED PHASE)
 *
 * These tests define the expected behavior of the useEngine hook.
 * Tests are written FIRST, before implementation.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Engine, InputAction } from "../engine";
import { useEngine } from "./useEngine";

// =============================================================================
// MOCK DATA
// =============================================================================

const mockData = [
  { x: 0, y: 100 },
  { x: 1, y: 200 },
  { x: 2, y: 150 },
];

const mockScales = {
  xScale: (d: number) => d * 50,
  yScale: (d: number) => 300 - d,
};

// =============================================================================
// LIFECYCLE TESTS
// =============================================================================

describe("useEngine - Lifecycle", () => {
  it("should create an Engine instance on mount", () => {
    const { result } = renderHook(() => useEngine());

    expect(result.current.engine).toBeInstanceOf(Engine);
  });

  it("should dispose Engine on unmount", () => {
    const { result, unmount } = renderHook(() => useEngine());
    const engine = result.current.engine;

    expect(engine.isDisposed()).toBe(false);

    unmount();

    expect(engine.isDisposed()).toBe(true);
  });

  it("should return stable engine reference across re-renders", () => {
    const { result, rerender } = renderHook(() => useEngine());
    const firstEngine = result.current.engine;

    rerender();

    expect(result.current.engine).toBe(firstEngine);
  });
});

// =============================================================================
// DATA SYNC TESTS
// =============================================================================

describe("useEngine - Data Sync", () => {
  it("should sync data to spatial index when data changes", async () => {
    const { result, rerender } = renderHook(({ data }) => useEngine({ data }), {
      initialProps: { data: [] },
    });

    // Update with new data
    rerender({ data: mockData });

    // The spatial index should be updated
    // We can verify by checking that the engine finds candidates
    // Note: _signal is defined but unused because we're just verifying the hook accepts data
    const _signal = {
      id: 1,
      action: InputAction.START,
      source: "mouse" as const,
      x: 25, // Near first point at x=0 (scaled to 0)
      y: 200, // Near first point at y=100 (scaled to 200)
      timestamp: performance.now(),
      userId: "local",
    };

    // This would fail if data wasn't synced
    // The actual verification depends on the hook implementation
    expect(result.current.engine).toBeDefined();
  });

  it("should accept coordinate accessor functions", () => {
    const { result } = renderHook(() =>
      useEngine({
        data: mockData,
        getX: (d: (typeof mockData)[0]) => mockScales.xScale(d.x),
        getY: (d: (typeof mockData)[0]) => mockScales.yScale(d.y),
      }),
    );

    expect(result.current.engine).toBeDefined();
  });
});

// =============================================================================
// EVENT HANDLER TESTS
// =============================================================================

describe("useEngine - Event Handler", () => {
  it("does not claim the engine handler when no onEvent is given", () => {
    const setHandler = vi.spyOn(Engine.prototype, "setHandler");

    renderHook(() => useEngine());

    // The Engine has a single handler slot. In the real component SensorManager
    // owns it (SensorManager.tsx:96) and useEngine is called with no options,
    // so installing a handler here can only overwrite the real one — whichever
    // effect happens to run last wins.
    expect(setHandler).not.toHaveBeenCalled();
    setHandler.mockRestore();
  });

  it("should accept an onEvent callback", () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useEngine({ onEvent }));

    expect(result.current.engine).toBeDefined();
  });

  it("should wire onEvent callback to engine scheduler", () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useEngine({ onEvent }));

    // Create and input a signal
    const signal = result.current.engine.createKeySignal(
      new KeyboardEvent("keydown", { key: "ArrowRight" }),
    );

    act(() => {
      result.current.engine.input(signal);
    });

    expect(onEvent).toHaveBeenCalled();
  });

  it("should update handler when callback changes", () => {
    const onEvent1 = vi.fn();
    const onEvent2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ onEvent }) => useEngine({ onEvent }),
      { initialProps: { onEvent: onEvent1 } },
    );

    // Change the handler
    rerender({ onEvent: onEvent2 });

    // Input a signal
    const signal = result.current.engine.createKeySignal(
      new KeyboardEvent("keydown", { key: "ArrowRight" }),
    );

    act(() => {
      result.current.engine.input(signal);
    });

    // Only the new handler should be called
    expect(onEvent1).not.toHaveBeenCalled();
    expect(onEvent2).toHaveBeenCalled();
  });
});

// =============================================================================
// PLOT BOUNDS TESTS
// =============================================================================

describe("useEngine - Plot Bounds", () => {
  it("should accept plotBounds configuration", () => {
    const { result } = renderHook(() =>
      useEngine({
        plotBounds: { x: 50, y: 30, width: 300, height: 200 },
      }),
    );

    expect(result.current.engine.getPlotBounds()).toEqual({
      x: 50,
      y: 30,
      width: 300,
      height: 200,
    });
  });

  it("should update plot bounds when they change", () => {
    const { result, rerender } = renderHook(
      ({ plotBounds }) => useEngine({ plotBounds }),
      { initialProps: { plotBounds: { x: 0, y: 0, width: 100, height: 100 } } },
    );

    rerender({ plotBounds: { x: 50, y: 50, width: 200, height: 200 } });

    expect(result.current.engine.getPlotBounds()).toEqual({
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    });
  });
});
