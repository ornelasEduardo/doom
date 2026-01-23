import { describe, expect, it, vi } from "vitest";

import { ElementHover } from "./ElementHover";

const createMockContext = (overrides: Record<string, unknown> = {}) => ({
  on: vi.fn(),
  off: vi.fn(),
  getChartContext: vi.fn(),
  emit: vi.fn(),
  pointerPosition: null,
  isWithinPlot: false,
  ...overrides,
});

describe("ElementHover", () => {
  it("registers event listeners", () => {
    const mockContext = createMockContext();

    const behavior = ElementHover();
    behavior(mockContext);

    expect(mockContext.on).toHaveBeenCalledWith(
      "CHART_POINTER_MOVE",
      expect.any(Function),
    );
    expect(mockContext.on).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });

  it("deregisters event listeners on cleanup", () => {
    const mockContext = createMockContext();

    const behavior = ElementHover();
    const cleanup = behavior(mockContext);

    cleanup();

    expect(mockContext.off).toHaveBeenCalledWith(
      "CHART_POINTER_MOVE",
      expect.any(Function),
    );
    expect(mockContext.off).toHaveBeenCalledWith(
      "CHART_POINTER_LEAVE",
      expect.any(Function),
    );
  });

  it("updates hover state when targetResolver returns true", () => {
    const setHoverState = vi.fn();
    const resolveInteraction = vi.fn();
    const getChartContext = vi.fn().mockReturnValue({
      resolveInteraction,
      setHoverState,
    });

    const mockContext = createMockContext({ getChartContext });

    const behavior = ElementHover({
      targetResolver: () => true,
    });
    behavior(mockContext);

    const handleMoveCall = mockContext.on.mock.calls.find(
      (call: unknown[]) => call[0] === "CHART_POINTER_MOVE",
    );
    const handleMove = handleMoveCall?.[1];

    const mockElement = document.createElement("div");
    const mockData = { id: 1 };

    resolveInteraction.mockReturnValue({
      element: mockElement,
      data: mockData,
    });

    handleMove?.({
      nativeEvent: new MouseEvent("mousemove"),
      coordinates: { chartX: 10, chartY: 20, containerX: 30, containerY: 40 },
    });

    expect(setHoverState).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockData,
        cursorLineX: 10,
        cursorLineY: 20,
        tooltipX: 30,
        tooltipY: 40,
        isTouch: false,
      }),
    );
  });

  it("does not update hover state when targetResolver returns false", () => {
    const setHoverState = vi.fn();
    const resolveInteraction = vi.fn();
    const getChartContext = vi.fn().mockReturnValue({
      resolveInteraction,
      setHoverState,
    });

    const mockContext = createMockContext({ getChartContext });

    const behavior = ElementHover({
      targetResolver: () => false,
    });
    behavior(mockContext);

    const handleMoveCall = mockContext.on.mock.calls.find(
      (call: unknown[]) => call[0] === "CHART_POINTER_MOVE",
    );
    const handleMove = handleMoveCall?.[1];

    resolveInteraction.mockReturnValue({
      element: document.createElement("div"),
      data: { id: 1 },
    });

    handleMove?.({
      nativeEvent: new MouseEvent("mousemove"),
      coordinates: { chartX: 0, chartY: 0, containerX: 0, containerY: 0 },
    });

    expect(setHoverState).toHaveBeenCalledWith(null);
  });

  it("transforms data using getData", () => {
    const setHoverState = vi.fn();
    const resolveInteraction = vi.fn();
    const getChartContext = vi.fn().mockReturnValue({
      resolveInteraction,
      setHoverState,
    });

    const mockContext = createMockContext({ getChartContext });

    const behavior = ElementHover({
      getData: (_el, data) => ({ ...data, transformed: true }),
    });
    behavior(mockContext);

    const handleMoveCall = mockContext.on.mock.calls.find(
      (call: unknown[]) => call[0] === "CHART_POINTER_MOVE",
    );
    const handleMove = handleMoveCall?.[1];

    resolveInteraction.mockReturnValue({
      element: document.createElement("div"),
      data: { original: true },
    });

    handleMove?.({
      nativeEvent: new MouseEvent("mousemove"),
      coordinates: { chartX: 0, chartY: 0, containerX: 0, containerY: 0 },
    });

    expect(setHoverState).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { original: true, transformed: true },
      }),
    );
  });

  it("clears hover state on leave", () => {
    const setHoverState = vi.fn();
    const getChartContext = vi.fn().mockReturnValue({ setHoverState });

    const mockContext = createMockContext({ getChartContext });

    const behavior = ElementHover();
    behavior(mockContext);

    const handleLeaveCall = mockContext.on.mock.calls.find(
      (call: unknown[]) => call[0] === "CHART_POINTER_LEAVE",
    );
    const handleLeave = handleLeaveCall?.[1];

    handleLeave?.();

    expect(setHoverState).toHaveBeenCalledWith(null);
  });
});
