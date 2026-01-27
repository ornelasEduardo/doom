import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { LineSeriesWrapper } from "./LineSeries";

// Mock the context hook
const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("LineSeries", () => {
  const defaultContext = {
    data: [
      { x: 0, y: 10 },
      { x: 50, y: 20 },
      { x: 100, y: 5 },
    ],
    width: 100,
    height: 100,
    config: { margin: { top: 0, left: 0, right: 0, bottom: 0 } },
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    interactionStore: {
      useStore: (selector: any) => selector({ interactions: new Map() }),
      getState: () => ({ interactions: new Map() }),
    },
    seriesStore: {
      getState: () => ({ series: new Map(), processedSeries: [] }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      useStore: vi.fn(),
    },
    chartStore: {
      getState: () => ({
        series: new Map(),
        processedSeries: [],
        interactions: new Map(),
        scales: { x: (val: any) => val, y: (val: any) => val },
        dimensions: {
          width: 500,
          height: 300,
          innerHeight: 250,
          innerWidth: 440,
          margin: { top: 0, left: 0 },
        },
        data: [
          { x: 0, y: 10 },
          { x: 50, y: 20 },
          { x: 100, y: 5 },
        ],
      }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      useStore: vi.fn((selector) =>
        selector({
          series: new Map(),
          processedSeries: [],
          interactions: new Map(),
          scales: { x: (val: any) => val, y: (val: any) => val },
          dimensions: {
            width: 500,
            height: 300,
            innerHeight: 250,
            innerWidth: 440,
          },
          data: [
            { x: 0, y: 10 },
            { x: 50, y: 20 },
            { x: 100, y: 5 },
          ],
        }),
      ),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders line and area paths", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <LineSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector(".chart-line-series")).toBeInTheDocument();
    // Check for existence of paths without relying on CSS module class names
    const paths = container.querySelectorAll("path");
    // Should have 1 path (line) as area is now optional/typed
    expect(paths.length).toBe(1);
  });

  it("renders nothing when data is empty", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      chartStore: {
        ...defaultContext.chartStore,
        useStore: (selector: any) =>
          selector({
            scales: { x: (val: any) => val, y: (val: any) => val },
            dimensions: {
              width: 500,
              height: 300,
              innerHeight: 250,
              innerWidth: 440,
              margin: { top: 0, left: 0 },
            },
            data: [],
          }),
      },
    });

    const { container } = render(
      <svg>
        <LineSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("path")).not.toBeInTheDocument();
  });

  it("renders nothing when dimensions are zero", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      chartStore: {
        ...defaultContext.chartStore,
        useStore: (selector: any) =>
          selector({
            scales: { x: (val: any) => val, y: (val: any) => val },
            dimensions: {
              width: 0,
              height: 0,
              innerHeight: 0,
              innerWidth: 0,
              margin: { top: 0, left: 0 },
            },
            data: [
              { x: 0, y: 10 },
              { x: 50, y: 20 },
            ],
          }),
      },
    });

    const { container } = render(
      <svg>
        <LineSeriesWrapper />
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
        <LineSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("path")).not.toBeInTheDocument();
  });

  it("applies custom color prop", () => {
    useChartContextMock.mockReturnValue(defaultContext);
    const customColor = "red";

    const { container } = render(
      <svg>
        <LineSeriesWrapper color={customColor} />
      </svg>,
    );

    const paths = container.querySelectorAll("path");
    paths.forEach((path) => {
      // One is stroke, one is fill
      // Area has fill: strokeColor
      // Line has stroke: strokeColor
      const style = path.getAttribute("style");
      expect(style).toMatch(/red/);
    });
  });

  it("renders dots when showDots is true", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <LineSeriesWrapper showDots={true} />
      </svg>,
    );

    expect(container.querySelectorAll("circle").length).toBe(3);
  });

  it("prefer local props over context", () => {
    // Local data overrides context data
    useChartContextMock.mockReturnValue(defaultContext);
    const localData = [{ x: 10, y: 10 }];

    const { container } = render(
      <svg>
        <LineSeriesWrapper data={localData} showDots={true} />
      </svg>,
    );

    // Should render 1 dot instead of 3
    expect(container.querySelectorAll("circle").length).toBe(1);
  });

  it("does not render area gradient when type is line even if withGradient is true", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      config: { ...defaultContext.config, withGradient: true },
    });

    const { container } = render(
      <svg>
        <LineSeriesWrapper type="line" />
      </svg>,
    );

    // Should only render the line path, not the area path
    const paths = container.querySelectorAll("path");
    // Currently (buggy behavior) it renders 2 paths: line and area
    // We expect it to be 1 after fix.
    // Ideally we assert failure first, but I'll write the assertion for the CORRECT behavior.
    expect(paths.length).toBe(1);
    expect(container.querySelector(".area")).not.toBeInTheDocument();
  });
});
