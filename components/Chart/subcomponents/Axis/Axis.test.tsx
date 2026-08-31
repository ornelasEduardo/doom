import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { Axis } from "./Axis";

const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("Axis", () => {
  const defaultContext = {
    data: [
      { x: 0, y: 10 },
      { x: 100, y: 20 },
    ],
    width: 200,
    height: 200,
    config: {
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      showAxes: true,
    },
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    chartStore: {
      getState: () => ({
        series: new Map(),
        processedSeries: [],
        interactions: new Map(),
        scales: {
          x: Object.assign(
            vi.fn((val: any) => val),
            {
              domain: vi.fn(),
              range: vi.fn(() => [0, 200]),
              copy: vi.fn(() => vi.fn((val: any) => val)),
              ticks: vi.fn(() => [0, 50, 100]),
            },
          ),
          y: Object.assign(
            vi.fn((val: any) => val),
            {
              domain: vi.fn(),
              range: vi.fn(() => [200, 0]),
              copy: vi.fn(() => vi.fn((val: any) => val)),
              ticks: vi.fn(() => [0, 10, 20]),
            },
          ),
        },
        dimensions: {
          width: 200,
          height: 200,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        data: [],
      }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      useStore: vi.fn((selector) =>
        selector({
          series: new Map(),
          processedSeries: [],
          interactions: new Map(),
          scales: {
            x: Object.assign(
              vi.fn((val: any) => val),
              {
                domain: vi.fn(),
                range: vi.fn(() => [0, 200]),
                copy: vi.fn(() => vi.fn((val: any) => val)),
                ticks: vi.fn(() => [0, 50, 100]),
              },
            ),
            y: Object.assign(
              vi.fn((val: any) => val),
              {
                domain: vi.fn(),
                range: vi.fn(() => [200, 0]),
                copy: vi.fn(() => vi.fn((val: any) => val)),
                ticks: vi.fn(() => [0, 10, 20]),
              },
            ),
          },
          dimensions: {
            width: 200,
            height: 200,
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
          },
          data: [],
        }),
      ),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders axes when showAxes is true", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <Axis />
      </svg>,
    );

    // Correct class name is chart-axes (plural)
    // Check for the main group structure
    const mainGroup = container.querySelector("g");
    expect(mainGroup).toBeInTheDocument();

    // Should have X and Y groups (refs gx, gy) inside
    const groups = container.querySelectorAll("g");
    // Axis component has wrapper group, plus gx and gy. So at least 3 groups total (wrapper + 2 axes)
    expect(groups.length).toBeGreaterThanOrEqual(3);
  });

  it("renders nothing until the scales exist", () => {
    // Axis's only guard is `if (!xScale || !yScale) return null`. It does not
    // read config.showAxes — that is decided by the parent, which simply does
    // not render <Axis> (Chart.tsx:37, Root.tsx:539). Asserting showAxes here
    // tested a responsibility this component does not have.
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      chartStore: {
        ...defaultContext.chartStore,
        // Axis reads through useStore, not getState.
        useStore: vi.fn((selector: any) =>
          selector({
            dimensions: {
              margin: { top: 20, right: 20, bottom: 20, left: 20 },
              innerWidth: 160,
              innerHeight: 160,
            },
            scales: { x: null, y: null },
          }),
        ),
      },
    });

    const { container } = render(
      <svg>
        <Axis />
      </svg>,
    );

    expect(container.querySelector("g")).not.toBeInTheDocument();
  });
});
