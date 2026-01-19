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

  it("renders nothing when showAxes is false", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      config: { ...defaultContext.config, showAxes: false },
    });

    const { container } = render(
      <svg>
        <Axis />
      </svg>,
    );

    expect(container.querySelector(".chart-axes")).not.toBeInTheDocument();
  });

  it("renders nothing when dimensions are zero", () => {
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      width: 0,
      height: 0,
    });

    const { container } = render(
      <svg>
        <Axis />
      </svg>,
    );

    expect(container.querySelector(".chart-axes")).not.toBeInTheDocument();
  });
});
