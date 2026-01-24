import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { CursorLine, CursorWrapper } from "./Cursor";

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
      cursorLineX: 60,
      cursorLineY: 50,
      tooltipX: 60,
      tooltipY: 50,
      data: { x: 50, y: 20 },
      isTouch: false,
    },

    seriesStore: {
      getState: () => ({ series: new Map(), processedSeries: [] }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      useStore: (selector: any) => {
        const state = {
          series: new Map(),
          processedSeries: [{ id: "series1", hideCursor: false }],
        };

        return selector(state);
      },
    },
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
    expect(container.querySelector("line")).toBeInTheDocument();

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
      data: [
        { x: 0, y: 10 },
        { x: 50, y: 20 },
        { x: 100, y: 5 },
      ],
    });

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toBeInTheDocument();
  });

  describe("cursor line positioning", () => {
    it("uses cursorLineX (not tooltipX) for line position", () => {
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        hoverState: {
          cursorLineX: 70,
          cursorLineY: 50,
          tooltipX: 100,
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
        seriesStore: {
          ...defaultContext.seriesStore,
          useStore: (selector: any) =>
            selector({
              series: new Map(),
              processedSeries: [{ id: "series1", hideCursor: true }],
            }),
        },
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
      expect(line).toHaveAttribute("y1", "0");
      expect(line).toHaveAttribute("y2", "80");
    });
  });
});
