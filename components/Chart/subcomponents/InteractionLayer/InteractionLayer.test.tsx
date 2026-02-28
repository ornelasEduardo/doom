/**
 * InteractionLayer Tests (Engine Integration)
 *
 * Tests for the InteractionLayer that captures DOM events
 * and forwards them to the Engine as InputSignals.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChartContext } from "../../context";
import { useEngine } from "../../hooks/useEngine";
import { InteractionLayer } from "./InteractionLayer";

// =============================================================================
// MOCKS
// =============================================================================

vi.mock("../../context");
vi.mock("../../hooks/useEngine");

// =============================================================================
// TEST SETUP
// =============================================================================

describe("InteractionLayer", () => {
  const mockEngineInput = vi.fn();
  const mockCreateSignal = vi.fn();
  const mockCreateKeySignal = vi.fn();
  const mockSetContainer = vi.fn();
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

    const mockEngine = {
      input: mockEngineInput,
      createSignal: mockCreateSignal.mockReturnValue({
        id: 0,
        action: "START",
        source: "mouse",
        x: 100,
        y: 100,
        timestamp: 0,
        userId: "local",
      }),
      createKeySignal: mockCreateKeySignal.mockReturnValue({
        id: 0,
        action: "KEY",
        source: "keyboard",
        x: 0,
        y: 0,
        timestamp: 0,
        userId: "local",
        key: "ArrowRight",
      }),
      setContainer: mockSetContainer,
    };

    // Mock useEngine hook
    (useEngine as ReturnType<typeof vi.fn>).mockReturnValue({
      engine: mockEngine,
      containerRef: { current: null },
    });

    // Mock useChartContext
    (useChartContext as ReturnType<typeof vi.fn>).mockReturnValue({
      chartStore: { getState: mockGetState },
      engine: mockEngine,
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
  // ENGINE SIGNAL TESTS
  // ===========================================================================

  describe("Engine Signals", () => {
    it("should call engine.input() on pointerdown", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerDown(container, { clientX: 100, clientY: 100 });

      expect(mockCreateSignal).toHaveBeenCalledWith(
        expect.any(Object),
        "START",
      );
      expect(mockEngineInput).toHaveBeenCalled();
    });

    it("should call engine.input() on pointerup", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerUp(container, { clientX: 100, clientY: 100 });

      expect(mockCreateSignal).toHaveBeenCalledWith(expect.any(Object), "END");
      expect(mockEngineInput).toHaveBeenCalled();
    });

    it("should call engine.input() on pointerleave", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerLeave(container, { clientX: 100, clientY: 100 });

      expect(mockCreateSignal).toHaveBeenCalledWith(
        expect.any(Object),
        "CANCEL",
      );
      expect(mockEngineInput).toHaveBeenCalled();
    });

    it("should call engine.input() on pointermove", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.pointerMove(container, { clientX: 100, clientY: 100 });

      expect(mockCreateSignal).toHaveBeenCalledWith(expect.any(Object), "MOVE");
      expect(mockEngineInput).toHaveBeenCalled();
    });

    it("should call engine.input() with KEY signal on keyboard events", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.keyDown(container, { key: "ArrowRight" });

      expect(mockCreateKeySignal).toHaveBeenCalledWith(expect.any(Object));
      expect(mockEngineInput).toHaveBeenCalled();
    });

    it("should ignore non-navigation keyboard events", () => {
      render(
        <ContainerWrapper>
          <InteractionLayer />
        </ContainerWrapper>,
      );

      const container = document.querySelector("[data-chart-container]")!;
      fireEvent.keyDown(container, { key: "a" });

      // Should not call createKeySignal for regular keys
      expect(mockCreateKeySignal).not.toHaveBeenCalled();
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

      (useEngine as ReturnType<typeof vi.fn>).mockReturnValue({
        engine: {
          input: mockEngineInput,
          createSignal: mockCreateSignal.mockReturnValue({ id: 0 }),
          createKeySignal: mockCreateKeySignal,
          setContainer: mockSetContainer,
        },
        containerRef: { current: null },
      });
      (useChartContext as ReturnType<typeof vi.fn>).mockReturnValue({
        chartStore: { getState: mockGetState },
        engine: {
          input: mockEngineInput,
          createSignal: mockCreateSignal.mockReturnValue({ id: 0 }),
          createKeySignal: mockCreateKeySignal,
          setContainer: mockSetContainer,
        },
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
      expect(mockEngineInput).toHaveBeenCalledTimes(1);

      // pointerup should be processed immediately
      fireEvent.pointerUp(container, { clientX: 100, clientY: 100 });
      expect(mockEngineInput).toHaveBeenCalledTimes(2);

      // pointerleave should be processed immediately
      fireEvent.pointerLeave(container, { clientX: 100, clientY: 100 });
      expect(mockEngineInput).toHaveBeenCalledTimes(3);
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
