/**
 * EventContext Tests (TDD - RED PHASE)
 *
 * Tests for the EventContext that manages chart event distribution.
 * Tests define expected behavior, written before any changes.
 */

import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartEvent } from "../types/events";
import { EventsProvider, useEventContext } from "./EventContext";

// =============================================================================
// TEST WRAPPER
// =============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EventsProvider>{children}</EventsProvider>
);

// =============================================================================
// BASIC FUNCTIONALITY TESTS
// =============================================================================

describe("EventContext - Basic Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw if used outside provider", () => {
    // Suppress expected error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useEventContext());
    }).toThrow("Event components must be used within a EventsProvider");

    consoleSpy.mockRestore();
  });

  it("should provide context within provider", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.emit).toBeDefined();
    expect(result.current.on).toBeDefined();
    expect(result.current.off).toBeDefined();
  });
});

// =============================================================================
// EVENT EMISSION TESTS
// =============================================================================

describe("EventContext - Event Emission", () => {
  it("should call registered listeners when event is emitted", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });
    const listener = vi.fn();

    act(() => {
      result.current.on("CHART_POINTER_MOVE", listener);
    });

    const event: ChartEvent = {
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

    act(() => {
      result.current.emit(event);
    });

    expect(listener).toHaveBeenCalledWith(event);
  });

  it("should not call listeners for different event types", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });
    const moveListener = vi.fn();

    act(() => {
      result.current.on("CHART_POINTER_MOVE", moveListener);
    });

    const event: ChartEvent = {
      type: "CHART_POINTER_DOWN",
      coordinates: {
        containerX: 100,
        containerY: 100,
        chartX: 50,
        chartY: 50,
        isWithinPlot: true,
      },
      nativeEvent: new PointerEvent("pointerdown"),
    };

    act(() => {
      result.current.emit(event);
    });

    expect(moveListener).not.toHaveBeenCalled();
  });

  it("should call multiple listeners for the same event type", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    act(() => {
      result.current.on("CHART_POINTER_MOVE", listener1);
      result.current.on("CHART_POINTER_MOVE", listener2);
    });

    const event: ChartEvent = {
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

    act(() => {
      result.current.emit(event);
    });

    expect(listener1).toHaveBeenCalledWith(event);
    expect(listener2).toHaveBeenCalledWith(event);
  });
});

// =============================================================================
// LISTENER REGISTRATION TESTS
// =============================================================================

describe("EventContext - Listener Registration", () => {
  it("should remove listener when off is called", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });
    const listener = vi.fn();

    act(() => {
      result.current.on("CHART_POINTER_MOVE", listener);
    });

    act(() => {
      result.current.off("CHART_POINTER_MOVE", listener);
    });

    const event: ChartEvent = {
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

    act(() => {
      result.current.emit(event);
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle off for non-existent listener gracefully", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });
    const listener = vi.fn();

    // Should not throw
    expect(() => {
      act(() => {
        result.current.off("CHART_POINTER_MOVE", listener);
      });
    }).not.toThrow();
  });
});

// =============================================================================
// POINTER STATE TESTS
// =============================================================================

describe("EventContext - Pointer State", () => {
  it("should update pointerPosition on CHART_POINTER_MOVE", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });

    const coords = {
      containerX: 150,
      containerY: 120,
      chartX: 100,
      chartY: 80,
      isWithinPlot: true,
    };

    act(() => {
      result.current.emit({
        type: "CHART_POINTER_MOVE",
        coordinates: coords,
        nativeEvent: new PointerEvent("pointermove"),
      });
    });

    expect(result.current.pointerPosition).toEqual(coords);
    expect(result.current.isWithinPlot).toBe(true);
  });

  it("should update pointerPosition on CHART_POINTER_DOWN", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });

    const coords = {
      containerX: 150,
      containerY: 120,
      chartX: 100,
      chartY: 80,
      isWithinPlot: true,
    };

    act(() => {
      result.current.emit({
        type: "CHART_POINTER_DOWN",
        coordinates: coords,
        nativeEvent: new PointerEvent("pointerdown"),
      });
    });

    expect(result.current.pointerPosition).toEqual(coords);
  });

  it("should clear pointerPosition on CHART_POINTER_LEAVE", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });

    // First set a position
    act(() => {
      result.current.emit({
        type: "CHART_POINTER_MOVE",
        coordinates: {
          containerX: 100,
          containerY: 100,
          chartX: 50,
          chartY: 50,
          isWithinPlot: true,
        },
        nativeEvent: new PointerEvent("pointermove"),
      });
    });

    expect(result.current.pointerPosition).not.toBeNull();

    // Then leave
    act(() => {
      result.current.emit({
        type: "CHART_POINTER_LEAVE",
        coordinates: {
          containerX: 0,
          containerY: 0,
          chartX: 0,
          chartY: 0,
          isWithinPlot: false,
        },
        nativeEvent: new PointerEvent("pointerleave"),
      });
    });

    expect(result.current.pointerPosition).toBeNull();
    expect(result.current.isWithinPlot).toBe(false);
  });
});

// =============================================================================
// PRIORITY DISPATCH TESTS (New Engine Integration)
// =============================================================================

describe("EventContext - Priority Dispatch (Future)", () => {
  // These tests define expected future behavior for Engine integration
  // They may fail initially (TDD RED phase)

  it("should handle events with priority metadata", () => {
    const { result } = renderHook(() => useEventContext(), { wrapper });
    const listener = vi.fn();

    act(() => {
      result.current.on("CHART_POINTER_MOVE", listener);
    });

    // EventContext should accept events with optional priority
    const event: ChartEvent = {
      type: "CHART_POINTER_MOVE",
      coordinates: {
        containerX: 100,
        containerY: 100,
        chartX: 50,
        chartY: 50,
        isWithinPlot: true,
      },
      nativeEvent: new PointerEvent("pointermove"),
      // Future: priority could be added to ChartEvent type
    };

    act(() => {
      result.current.emit(event);
    });

    // For now, just verify it still works
    expect(listener).toHaveBeenCalled();
  });
});
