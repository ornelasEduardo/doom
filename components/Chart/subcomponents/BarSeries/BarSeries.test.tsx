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
          { x: "A", y: 10 },
          { x: "B", y: 20 },
          { x: "C", y: 5 },
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
            margin: { top: 0, left: 0 },
          },
          data: [
            { x: "A", y: 10 },
            { x: "B", y: 20 },
            { x: "C", y: 5 },
          ],
        }),
      ),
    } as any,
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
      chartStore: {
        ...defaultContext.chartStore,
        useStore: (selector: any) =>
          selector({
            series: new Map(),
            processedSeries: [],
            interactions: new Map(),
            scales: { x: (val: any) => val, y: (val: any) => val },
            dimensions: {
              width: 300,
              height: 200,
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
        <BarSeriesWrapper />
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
            series: new Map(),
            processedSeries: [],
            interactions: new Map(),
            scales: { x: (val: any) => val, y: (val: any) => val },
            dimensions: {
              width: 0,
              height: 0,
              innerHeight: 0,
              innerWidth: 0,
              margin: { top: 0, left: 0 },
            },
            data: [
              { x: "A", y: 10 },
              { x: "B", y: 20 },
            ],
          }),
      },
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
});
