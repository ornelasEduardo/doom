import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { CustomSeries } from "./CustomSeries";

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

    renderSpy.mockClear();

    rerender(
      <svg>
        <CustomSeries render={renderSpy} />
      </svg>,
    );

    expect(renderSpy).not.toHaveBeenCalled();
  });
});
