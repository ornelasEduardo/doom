import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { CustomSeries } from "./CustomSeries";

// Mock the context hook
const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("CustomSeries", () => {
  const defaultContext = {
    data: [
      { x: 0, y: 10 },
      { x: 50, y: 20 },
    ],
    width: 100,
    height: 100,
    config: { margin: { top: 0, left: 0, right: 0, bottom: 0 } },
    x: (d: any) => d.x,
    y: (d: any) => d.y,
    registerSeries: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls render prop with correct context", () => {
    useChartContextMock.mockReturnValue(defaultContext);
    const renderSpy = vi.fn();

    render(
      <svg>
        <CustomSeries render={renderSpy} />
      </svg>,
    );

    expect(renderSpy).toHaveBeenCalled();
    const context = renderSpy.mock.calls[0][0];
    expect(context).toHaveProperty("g");
    expect(context).toHaveProperty("innerWidth");
    expect(context).toHaveProperty("innerHeight");
  });

  it("does NOT register a series", () => {
    useChartContextMock.mockReturnValue(defaultContext);
    // CustomSeries should bypass series registration
    render(
      <svg>
        <CustomSeries render={() => {}} />
      </svg>,
    );

    expect(defaultContext.registerSeries).not.toHaveBeenCalled();
  });

  it("renders null if no render prop is provided", () => {
    useChartContextMock.mockReturnValue(defaultContext);
    const { container } = render(
      <svg>
        <CustomSeries />
      </svg>,
    );

    expect(container.querySelector("g")).not.toBeInTheDocument();
  });

  it("does not re-invoke render on unrelated context updates (e.g. hover)", () => {
    useChartContextMock.mockReturnValue(defaultContext);
    const renderSpy = vi.fn();
    const { rerender } = render(
      <svg>
        <CustomSeries render={renderSpy} />
      </svg>,
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);

    // clear the mock to ensure clean slate
    renderSpy.mockClear();

    // Re-render with SAME props (simulating parent re-render)
    // or context update that doesn't change critical config
    rerender(
      <svg>
        <CustomSeries render={renderSpy} />
      </svg>,
    );

    // Should NOT have called render again because dependencies didn't change
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
