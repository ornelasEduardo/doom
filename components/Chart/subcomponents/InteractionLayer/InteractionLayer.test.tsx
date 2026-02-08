/**
 * InteractionLayer Tests (TDD - Expanded)
 *
 * Tests for the InteractionLayer that captures DOM events
 * and forwards them to the EventContext.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChartContext } from "../../context";
import { useEventContext } from "../../state/EventContext";
import { InteractionLayer } from "./InteractionLayer";

// =============================================================================
// MOCKS
// =============================================================================

vi.mock("../../context");
vi.mock("../../state/EventContext");

// =============================================================================
// TEST SETUP
// =============================================================================

describe("InteractionLayer", () => {
  const mockEmit = vi.fn();
  const mockGetState = vi.fn();
  const mockState = {
    dimensions: {
      margin: { left: 40, top: 20, right: 20, bottom: 40 },
      innerWidth: 500,
      innerHeight: 300,
      width: 560,
      height: 360,
    },
  };

  // Container wrapper for proper DOM context
  const ContainerWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <div
      data-chart-container
      style={{ position: "relative", width: 600, height: 400 }}
    >
      <svg
        data-chart-plot
        height={400}
        style={{ position: "absolute", left: 0, top: 0 }}
        width={600}
      />
      {children}
    </div>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    (useEventContext as ReturnType<typeof vi.fn>).mockReturnValue({
      emit: mockEmit,
    });
    (useChartContext as ReturnType<typeof vi.fn>).mockReturnValue({
      chartStore: { getState: mockGetState },
    });
    mockGetState.mockReturnValue(mockState);

    // Mock RAF to execute immediately for synchronous testing
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe("Rendering", () => {
    it("should render without crashing", () => {
      render(<InteractionLayer />);
      const element = screen.getByTestId("interaction-layer");
      expect(element).toBeInTheDocument();
    });

    it("should be invisible and not capture pointer events", () => {
      render(<InteractionLayer />);
      const element = screen.getByTestId("interaction-layer");
      const style = window.getComputedStyle(element);

      expect(style.pointerEvents).toBe("none");
      expect(style.visibility).toBe("hidden");
    });
  });

  // ===========================================================================
  // EVENT FORWARDING TESTS
  // ===========================================================================

  describe("Event Forwarding", () => {
    it("should emit CHART_POINTER_DOWN on pointerdown", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerDown(container, { clientX: 100, clientY: 100 });

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "CHART_POINTER_DOWN",
        }),
      );
    });

    it("should emit CHART_POINTER_UP on pointerup", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerUp(container, { clientX: 100, clientY: 100 });

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "CHART_POINTER_UP",
        }),
      );
    });

    it("should emit CHART_POINTER_LEAVE on pointerleave", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerLeave(container, { clientX: 100, clientY: 100 });

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "CHART_POINTER_LEAVE",
        }),
      );
    });

    it("should emit CHART_POINTER_MOVE on pointermove", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerMove(container, { clientX: 100, clientY: 100 });

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "CHART_POINTER_MOVE",
        }),
      );
    });

    it("should emit CHART_KEY_DOWN on keyboard events", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.keyDown(container, { key: "ArrowRight" });

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "CHART_KEY_DOWN",
        }),
      );
    });

    it("should ignore non-navigation keyboard events", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.keyDown(container, { key: "a" });

      // Should not emit for regular keys
      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // COORDINATE TESTS
  // ===========================================================================

  describe("Coordinates", () => {
    it("should include coordinates in emitted events", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerDown(container, { clientX: 150, clientY: 120 });

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          coordinates: expect.objectContaining({
            containerX: expect.any(Number),
            containerY: expect.any(Number),
            chartX: expect.any(Number),
            chartY: expect.any(Number),
            isWithinPlot: expect.any(Boolean),
          }),
        }),
      );
    });

    it("should include the native event in emitted events", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerDown(container, { clientX: 100, clientY: 100 });

      expect(mockEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nativeEvent: expect.any(Object),
        }),
      );
    });
  });

  // ===========================================================================
  // THROTTLING TESTS
  // ===========================================================================

  describe("Throttling", () => {
    it("should process state-change events immediately (not throttled)", () => {
      // Reset RAF mock to NOT execute immediately
      vi.restoreAllMocks();
      const rafCallback = vi.fn();
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        rafCallback.mockImplementation(cb);
        return 1;
      });

      (useEventContext as ReturnType<typeof vi.fn>).mockReturnValue({
        emit: mockEmit,
      });
      (useChartContext as ReturnType<typeof vi.fn>).mockReturnValue({
        chartStore: { getState: mockGetState },
      });
      mockGetState.mockReturnValue(mockState);

      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;

      // pointerdown should be processed immediately
      fireEvent.pointerDown(container, { clientX: 100, clientY: 100 });
      expect(mockEmit).toHaveBeenCalledTimes(1);

      // pointerup should be processed immediately
      fireEvent.pointerUp(container, { clientX: 100, clientY: 100 });
      expect(mockEmit).toHaveBeenCalledTimes(2);

      // pointerleave should be processed immediately
      fireEvent.pointerLeave(container, { clientX: 100, clientY: 100 });
      expect(mockEmit).toHaveBeenCalledTimes(3);
    });
  });

  // ===========================================================================
  // CLEANUP TESTS
  // ===========================================================================

  describe("Cleanup", () => {
    it("should remove event listeners on unmount", () => {
      const removeListenerSpy = vi.spyOn(
        HTMLElement.prototype,
        "removeEventListener",
      );

      const { unmount } = render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      unmount();

      // Should have removed the pointer event listeners
      expect(removeListenerSpy).toHaveBeenCalled();
      removeListenerSpy.mockRestore();
    });
  });
});
