import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { CursorLine, CursorWrapper } from "./Cursor";

// Mock the context hook
const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("Cursor", () => {
  const defaultContext = {
    data: [
      { x: 0, y: 10 },
      { x: 50, y: 20 },
      { x: 100, y: 5 },
    ],
    width: 100,
    height: 100,
    config: { margin: { top: 10, left: 10, right: 10, bottom: 10 } },
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    hoverState: {
      cursorLineX: 60, // Absolute coordinate (margin.left + 50)
      cursorLineY: 50,
      tooltipX: 60,
      tooltipY: 50,
      data: { x: 50, y: 20 },
      isTouch: false,
    },
    legendItems: [{ id: "series1", color: "red", yAccessor: (d: any) => d.y }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cursor line and dots when hoverState is present", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    expect(container.querySelector("line")).toBeInTheDocument();
    expect(container.querySelector("circle")).toBeInTheDocument();

    // Check line position
    // hoverState.x is 60. margin.left is 10.
    // inside wrapper translated by 10,10.
    // useCursorLogic: cx = hoverState.x - margin.left = 50.
    const line = container.querySelector("line");
    expect(line).toHaveAttribute("x1", "50");
    expect(line).toHaveAttribute("x2", "50");
  });

  it("renders nothing when hoverState is null", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      hoverState: null,
    });

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    expect(container.querySelector("line")).not.toBeInTheDocument();
    expect(container.querySelector("circle")).not.toBeInTheDocument();
  });

  it("renders nothing when dimensions are zero", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      width: 0,
      height: 0,
    });

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    expect(container.querySelector("line")).not.toBeInTheDocument();
  });

  it("renders dots for multiple series", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      legendItems: [
        { id: "s1", color: "red", yAccessor: (d: any) => d.y }, // y = 20
        { id: "s2", color: "blue", yAccessor: (d: any) => d.y * 2 }, // y = 40
      ],
      // Update y scale domain to cover new values?
      // createScales uses defaultContext.data.
      // If we access y*2, it might be out of domain if computed from data.
      // But let's assume scales handle it or we update data.
      // To be safe, let's keep it simple or update data.
      data: [
        { x: 0, y: 10 },
        { x: 50, y: 20 },
        { x: 100, y: 5 },
      ],
      // But we can't change yAccessor passed to createScales easily in this mock structure
      // because createScales is called inside the component using context.x/y.
      // However, CursorDots uses item.yAccessor to get VALUE.
      // Then uses scaleCtx.yScale(value).
      // If value is out of domain, scale still returns a value (just outside range).
    });

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);

    expect(circles[0].getAttribute("fill")).toBe("red");
    expect(circles[1].getAttribute("fill")).toBe("blue");
  });

  describe("cursor line positioning", () => {
    it("uses cursorLineX (not tooltipX) for line position", () => {
      // cursorLineX and tooltipX differ - line should use cursorLineX
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        hoverState: {
          cursorLineX: 70, // This should determine line position
          cursorLineY: 50,
          tooltipX: 100, // This is different - used for tooltip
          tooltipY: 50,
          data: { x: 50, y: 20 },
          isTouch: false,
        },
      });

      const { container } = render(
        <svg>
          <CursorWrapper />
        </svg>,
      );

      const line = container.querySelector("line");
      // cursorLineX (70) - margin.left (10) = 60
      expect(line).toHaveAttribute("x1", "60");
      expect(line).toHaveAttribute("x2", "60");
    });

    it("does not render cursor line when series hides cursor", () => {
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        hoverState: {
          cursorLineX: 50,
          cursorLineY: 50,
          tooltipX: 50,
          tooltipY: 50,
          data: { x: 50, y: 20 },
        },
        legendItems: [
          { label: "Series 1", color: "red", hideCursor: true }, // Bar series
        ],
      });

      const { container } = render(
        <svg>
          <CursorLine />
        </svg>,
      );

      expect(container.querySelector("line")).not.toBeInTheDocument();
    });

    it("renders cursor line when at least one series shows cursor", () => {
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        hoverState: {
          cursorLineX: 50,
          cursorLineY: 50,
          tooltipX: 50,
          tooltipY: 50,
          data: { x: 50, y: 20 },
        },
        legendItems: [
          { label: "Bar", color: "blue", hideCursor: true },
          { label: "Line", color: "red", hideCursor: false },
        ],
      });

      const { container } = render(
        <svg>
          <CursorLine />
        </svg>,
      );

      expect(container.querySelector("line")).toBeInTheDocument();
    });
    it("line extends from top to bottom of chart area", () => {
      useChartContextMock.mockReturnValue(defaultContext);

      const { container } = render(
        <svg>
          <CursorWrapper />
        </svg>,
      );

      const line = container.querySelector("line");
      // innerHeight = height - margin.top - margin.bottom = 100 - 10 - 10 = 80
      expect(line).toHaveAttribute("y1", "0");
      expect(line).toHaveAttribute("y2", "80");
    });
  });

  describe("cursor dots positioning", () => {
    it("positions dots at cursorLineX (snapped position)", () => {
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        hoverState: {
          cursorLineX: 70,
          cursorLineY: 50,
          tooltipX: 100, // Different from cursorLineX
          tooltipY: 50,
          data: { x: 50, y: 20 },
          isTouch: false,
        },
      });

      const { container } = render(
        <svg>
          <CursorWrapper />
        </svg>,
      );

      const circle = container.querySelector("circle");
      // Dot cx should match line x position (cursorLineX - margin.left = 60)
      expect(circle).toHaveAttribute("cx", "60");
    });

    it("hides dots for series with hideCursor flag", () => {
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        legendItems: [
          {
            id: "s1",
            color: "red",
            yAccessor: (d: { y: number }) => d.y,
            hideCursor: true,
          },
        ],
      });

      const { container } = render(
        <svg>
          <CursorWrapper />
        </svg>,
      );

      expect(container.querySelector("circle")).not.toBeInTheDocument();
    });
  });
});
