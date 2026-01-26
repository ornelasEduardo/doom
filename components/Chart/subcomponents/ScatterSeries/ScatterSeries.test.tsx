import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { ScatterSeriesWrapper } from "./ScatterSeries";

const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

vi.mock("../../utils/hooks", () => ({
  useSeriesRegistration: vi.fn(),
}));

describe("ScatterSeries", () => {
  const defaultContext = {
    data: [
      { x: 10, y: 100 },
      { x: 20, y: 200 },
      { x: 30, y: 150 },
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
    chartStore: {
      useStore: (selector: any) =>
        selector({
          scales: { x: (val: any) => val, y: (val: any) => val },
          data: [
            { x: 10, y: 100 },
            { x: 20, y: 200 },
            { x: 30, y: 150 },
          ],
          dimensions: { width: 300, height: 200, innerHeight: 200 },
          interactions: new Map(),
        }),
      getState: () => ({}),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders scatter circles", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <ScatterSeriesWrapper />
      </svg>,
    );

    expect(
      container.querySelector(".chart-scatter-series"),
    ).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(3);
  });

  it("renders nothing when data is empty", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      interactionStore: {
        ...defaultContext.interactionStore,
        // Override useStore to return empty data and keep other defaults
        useStore: (selector: any) =>
          selector({
            scales: { x: (val: any) => val, y: (val: any) => val },
            data: [],
            dimensions: { width: 300, height: 200, innerHeight: 200 },
          }),
      },
      chartStore: {
        ...defaultContext.chartStore,
        useStore: (selector: any) =>
          selector({
            scales: { x: (val: any) => val, y: (val: any) => val },
            data: [],
            dimensions: { width: 300, height: 200, innerHeight: 200 },
            interactions: new Map(),
          }),
      },
      data: [],
    });

    const { container } = render(
      <svg>
        <ScatterSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("circle")).not.toBeInTheDocument();
  });

  it("renders nothing when dimensions are zero", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      width: 0,
      height: 0,
      chartStore: {
        ...defaultContext.chartStore,
        useStore: (selector: any) =>
          selector({
            scales: { x: (val: any) => val, y: (val: any) => val },
            data: [
              { x: 10, y: 100 },
              { x: 20, y: 200 },
              { x: 30, y: 150 },
            ],
            dimensions: { width: 0, height: 0, innerHeight: 0 },
            interactions: new Map(),
          }),
      },
    });

    const { container } = render(
      <svg>
        <ScatterSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("circle")).not.toBeInTheDocument();
  });

  it("renders nothing when accessors are missing", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      x: undefined,
    });

    const { container } = render(
      <svg>
        <ScatterSeriesWrapper />
      </svg>,
    );

    expect(container.querySelector("circle")).not.toBeInTheDocument();
  });

  it("applies custom color prop", () => {
    useChartContextMock.mockReturnValue(defaultContext);
    const customColor = "green";

    const { container } = render(
      <svg>
        <ScatterSeriesWrapper color={customColor} />
      </svg>,
    );

    const circles = container.querySelectorAll("circle");
    circles.forEach((circle) => {
      const style = circle.getAttribute("style");
      expect(style).toMatch(/green/);
    });
  });
});
