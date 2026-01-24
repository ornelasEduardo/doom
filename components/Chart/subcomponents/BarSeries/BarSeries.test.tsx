import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { BarSeriesWrapper } from "./BarSeries";

// Mock the context hook
const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

// Mock useSeriesRegistration hook
vi.mock("../../utils/hooks", () => ({
  useSeriesRegistration: vi.fn(),
}));

describe("BarSeries", () => {
  const defaultContext = {
    data: [
      { x: "A", y: 10 },
      { x: "B", y: 20 },
      { x: "C", y: 5 },
    ],
    width: 300,
    height: 200,
    config: { margin: { top: 0, left: 0, right: 0, bottom: 0 } },
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    hoverState: null,
    seriesStore: {
      getState: () => ({ series: new Map(), processedSeries: [] }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      useStore: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders bar paths", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <BarSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector(".chart-bar-series")).toBeInTheDocument();
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(3); // 3 bars
  });

  it("renders nothing when data is empty", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      data: [],
    });

    const { container } = render(
      <svg>
        <BarSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("path")).not.toBeInTheDocument();
  });

  it("renders nothing when dimensions are zero", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      width: 0,
      height: 0,
    });

    const { container } = render(
      <svg>
        <BarSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("path")).not.toBeInTheDocument();
  });

  it("renders nothing when accessors are missing", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      x: undefined,
    });

    const { container } = render(
      <svg>
        <BarSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("path")).not.toBeInTheDocument();
  });

  it("applies custom color prop", () => {
    useChartContextMock.mockReturnValue(defaultContext);
    const customColor = "blue";

    const { container } = render(
      <svg>
        <BarSeriesWrapper color={customColor} />
      </svg>,
    );

    const paths = container.querySelectorAll("path");
    paths.forEach((path) => {
      const style = path.getAttribute("style");
      expect(style).toMatch(/blue/);
    });
  });

  it("applies dimming opacity when another bar is hovered", () => {
    // Hover the second item (B)
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      hoverState: { data: defaultContext.data[1] },
    });

    const { container } = render(
      <svg>
        <BarSeriesWrapper />
      </svg>,
    );

    const paths = container.querySelectorAll("path");
    // A (dimmed)
    expect(paths[0].getAttribute("style")).toContain("opacity: 0.6");
    // B (highlighted/normal)
    expect(paths[1].getAttribute("style")).toContain("opacity: 1");
    // C (dimmed)
    expect(paths[2].getAttribute("style")).toContain("opacity: 0.6");
  });
});
