import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { InteractionLayer } from "./InteractionLayer";

// Mock the context hook
const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("InteractionLayer", () => {
  const defaultContext = {
    data: [
      { x: 10, y: 20 },
      { x: 20, y: 40 },
      { x: 30, y: 60 },
    ],
    width: 500,
    height: 300,
    config: { margin: { top: 10, bottom: 10, left: 10, right: 10 } },
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    setHoverState: vi.fn(),
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders interaction rect with correct dimensions", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg height={300} width={500}>
        <InteractionLayer />
      </svg>,
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeInTheDocument();
    // Inner dimensions
    expect(rect).toHaveAttribute("width", "480");
    expect(rect).toHaveAttribute("height", "280");
  });

  it("does not render if dimensions are zero or negative", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      width: 0,
      height: 0,
    });

    const { container } = render(
      <svg>
        <InteractionLayer />
      </svg>,
    );

    expect(container.querySelector("rect")).not.toBeInTheDocument();
  });

  it("renders but does not trigger interaction on empty data", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      data: [],
    });

    const { container } = render(
      <svg>
        <InteractionLayer />
      </svg>,
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeInTheDocument(); // Still renders the overlay

    if (rect) {
      fireEvent.mouseMove(rect, { clientX: 100, clientY: 50 });
    }

    expect(defaultContext.setHoverState).not.toHaveBeenCalled();
  });

  it("calls setHoverState on mouse move", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg height={300} width={500}>
        <InteractionLayer />
      </svg>,
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeInTheDocument();

    // Mock getBoundingClientRect for the rect
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 10, // Margin left offset in SVG coordinates?
      // Wait, clientX is screen coordinates. SVG rect is somewhere on screen.
      // The logical calc is: pointerX = clientX - svgRect.left - margin.left
      // BUT, line 209: pointerX = clientX - svgRect.left
      // Wait, let's check code again.
      // In my previous `InteractionLayer.tsx` read (Step 425):
      // Line 209: const pointerX = clientX - svgRect.left;
      // Line 186: const svgRect = (event.currentTarget as Element).getBoundingClientRect();
      // event.currentTarget IS the <rect>.
      // So if we mock the <rect>'s BoundingBox, pointerX is local to the rect.
      // Which is correct because the rect is logically the drawing area.
      top: 10,
      width: 480,
      height: 280,
      x: 10,
      y: 10,
      bottom: 290,
      right: 490,
      toJSON: () => {},
    } as DOMRect);

    if (rect) {
      // If clientX is 20, and rect.left is 10, then pointerX is 10 relative to the rect.
      // The rect is at margin.left (10).
      // So visually the chart starts at x=10.
      // We want to find the data point at x=10 relative to the data domain?
      // Wait, xScale converts data to pixels (0 to 480).
      // If we supply clientX = 10 + 10 (margin) = 20? No.
      // If clientX = 20, svgRect.left = 10, pointerX = 10.
      // This corresponds to x=10 on the scale roughly.
      fireEvent.mouseMove(rect, { clientX: 20, clientY: 20 });
    }

    expect(defaultContext.setHoverState).toHaveBeenCalled();
  });

  it("resets hover state on mouse leave", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <InteractionLayer />
      </svg>,
    );

    const rect = container.querySelector("rect");
    if (rect) {
      fireEvent.mouseLeave(rect);
    }

    expect(defaultContext.setHoverState).toHaveBeenCalledWith(null);
  });

  describe("HoverState field structure", () => {
    it("calls setHoverState with all required HoverState fields", () => {
      const setHoverStateMock = vi.fn();
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        setHoverState: setHoverStateMock,
      });

      const { container } = render(
        <svg height={300} width={500}>
          <InteractionLayer />
        </svg>,
      );

      const rect = container.querySelector("rect");
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        left: 10,
        top: 10,
        width: 480,
        height: 280,
        x: 10,
        y: 10,
        bottom: 290,
        right: 490,
        toJSON: () => {},
      } as DOMRect);

      if (rect) {
        fireEvent.mouseMove(rect, { clientX: 100, clientY: 100 });
      }

      expect(setHoverStateMock).toHaveBeenCalled();
      const hoverState = setHoverStateMock.mock.calls[0][0];

      // Verify all required HoverState fields exist
      expect(hoverState).toHaveProperty("cursorLineX");
      expect(hoverState).toHaveProperty("cursorLineY");
      expect(hoverState).toHaveProperty("tooltipX");
      expect(hoverState).toHaveProperty("tooltipY");
      expect(hoverState).toHaveProperty("data");
      expect(hoverState).toHaveProperty("isTouch");
    });

    it("sets cursorLineX to snapped data point position plus margin", () => {
      const setHoverStateMock = vi.fn();
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        setHoverState: setHoverStateMock,
      });

      const { container } = render(
        <svg height={300} width={500}>
          <InteractionLayer />
        </svg>,
      );

      const rect = container.querySelector("rect");
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        left: 10,
        top: 10,
        width: 480,
        height: 280,
        x: 10,
        y: 10,
        bottom: 290,
        right: 490,
        toJSON: () => {},
      } as DOMRect);

      if (rect) {
        fireEvent.mouseMove(rect, { clientX: 100, clientY: 100 });
      }

      const hoverState = setHoverStateMock.mock.calls[0][0];
      // cursorLineX should be a number that includes margin.left offset
      expect(typeof hoverState.cursorLineX).toBe("number");
      expect(hoverState.cursorLineX).toBeGreaterThanOrEqual(
        defaultContext.config.margin.left,
      );
    });

    it("sets tooltipX to raw pointer position plus margin", () => {
      const setHoverStateMock = vi.fn();
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        setHoverState: setHoverStateMock,
      });

      const { container } = render(
        <svg height={300} width={500}>
          <InteractionLayer />
        </svg>,
      );

      const rect = container.querySelector("rect");
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        left: 10,
        top: 10,
        width: 480,
        height: 280,
        x: 10,
        y: 10,
        bottom: 290,
        right: 490,
        toJSON: () => {},
      } as DOMRect);

      if (rect) {
        // clientX = 100, rect.left = 10, so pointerX = 90
        // tooltipX = pointerX + margin.left = 90 + 10 = 100
        fireEvent.mouseMove(rect, { clientX: 100, clientY: 100 });
      }

      const hoverState = setHoverStateMock.mock.calls[0][0];
      // tooltipX should be clientX - rect.left + margin.left = 100 - 10 + 10 = 100
      expect(hoverState.tooltipX).toBe(100);
    });

    it("sets isTouch to false for mouse events", () => {
      const setHoverStateMock = vi.fn();
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        setHoverState: setHoverStateMock,
      });

      const { container } = render(
        <svg height={300} width={500}>
          <InteractionLayer />
        </svg>,
      );

      const rect = container.querySelector("rect");
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        left: 10,
        top: 10,
        width: 480,
        height: 280,
        x: 10,
        y: 10,
        bottom: 290,
        right: 490,
        toJSON: () => {},
      } as DOMRect);

      if (rect) {
        fireEvent.mouseMove(rect, { clientX: 100, clientY: 100 });
      }

      const hoverState = setHoverStateMock.mock.calls[0][0];
      expect(hoverState.isTouch).toBe(false);
    });

    it("includes closest data point in hover state", () => {
      const setHoverStateMock = vi.fn();
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        setHoverState: setHoverStateMock,
      });

      const { container } = render(
        <svg height={300} width={500}>
          <InteractionLayer />
        </svg>,
      );

      const rect = container.querySelector("rect");
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        left: 10,
        top: 10,
        width: 480,
        height: 280,
        x: 10,
        y: 10,
        bottom: 290,
        right: 490,
        toJSON: () => {},
      } as DOMRect);

      if (rect) {
        fireEvent.mouseMove(rect, { clientX: 100, clientY: 100 });
      }

      const hoverState = setHoverStateMock.mock.calls[0][0];
      // data should be one of the data points
      expect(hoverState.data).toBeDefined();
      expect(hoverState.data).toHaveProperty("y");
    });

    it("offsets cursor line by half bandwidth for bar charts", () => {
      const setHoverStateMock = vi.fn();
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        config: { ...defaultContext.config, type: "bar" }, // Band scale!
        setHoverState: setHoverStateMock,
      });

      const { container } = render(
        <svg height={300} width={500}>
          <InteractionLayer />
        </svg>,
      );

      const rect = container.querySelector("rect");
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        left: 10,
        top: 10,
        width: 480,
        height: 280,
        x: 10,
        y: 10,
        bottom: 290,
        right: 490,
        toJSON: () => {},
      } as DOMRect);

      if (rect) {
        // Hover over first data point x=10 approx.
        fireEvent.mouseMove(rect, { clientX: 20, clientY: 20 });
      }

      const hoverState = setHoverStateMock.mock.calls[0][0];
      const cursorX = hoverState.cursorLineX;

      // With Point scale (default), x=10 (first point) would map to 0 on range [0, 480].
      // With Band scale (padding 0.1), x=10 maps to start of band.
      // Cursor should be at start + bandwidth/2.
      // We don't know exact bandwidth calculation here easily without replicating d3 logic,
      // but we know it should NOT be exactly at the start (margin.left).
      // margin.left = 10.

      // If it was Point scale: cursorX would be ~10 (10 + 0).
      // If it is Band scale: cursorX > 10.

      expect(cursorX).toBeGreaterThan(10.1);
    });
  });
});
