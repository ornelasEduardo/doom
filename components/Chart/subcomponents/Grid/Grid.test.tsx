import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { Grid } from "./Grid";

const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("Grid", () => {
  const defaultContext = {
    data: [
      { x: 0, y: 10 },
      { x: 100, y: 20 },
    ],
    width: 200,
    height: 200,
    config: {
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      grid: true,
    },
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    chartStore: {
      useStore: (selector: any) =>
        selector({
          scales: {
            x: (val: any) => val,
            y: (() => {
              const fn = (val: any) => val;
              (fn as any).ticks = () => [0, 10, 20];
              return fn;
            })(),
          },
          dimensions: {
            width: 200,
            height: 200,
            innerHeight: 200,
            innerWidth: 200,
          },
        }),
      getState: () => ({}),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders grid lines when grid is true", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <Grid />
      </svg>,
    );

    expect(container.querySelector("g")).toBeInTheDocument();
    // Should have lines
    expect(container.querySelectorAll("line").length).toBeGreaterThan(0);
  });

  it("renders nothing when grid is false", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      config: { ...defaultContext.config, grid: false },
    });

    const { container } = render(
      <svg>
        <Grid />
      </svg>,
    );

    expect(container.querySelector(".chart-grid")).not.toBeInTheDocument();
  });
});
