import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { InteractionType } from "../../types/interaction";
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

  it("applies dimming opacity when another point is hovered", () => {
    const localData = [
      { id: 1, x: 10, y: 100 },
      { id: 2, x: 20, y: 200 },
      { id: 3, x: 30, y: 150 },
    ];
    const targetedPoint = localData[1];

    const interactionState = {
      interactions: new Map([
        [
          InteractionType.HOVER,
          {
            target: { data: targetedPoint, coordinate: { x: 20, y: 200 } },
          },
        ],
      ]),
    };

    useChartContextMock.mockReturnValue({
      ...defaultContext,
      data: localData,
      interactionStore: {
        ...defaultContext.interactionStore,
        useStore: (selector: any) => selector(interactionState),
      },
    });

    const { container } = render(
      <svg>
        <ScatterSeriesWrapper />
      </svg>,
    );

    const circles = container.querySelectorAll("circle");

    const getPoint = (idx: number) =>
      Array.from(circles).find(
        (c) => c.getAttribute("data-index") === String(idx),
      );

    // Point 0 (x=10) - Not hovered, should be dimmed
    expect(getPoint(0)?.getAttribute("style")).toMatch(/opacity:\s*0\.6/);
    // Point 1 (x=20) - Hovered, should NOT be dimmed
    expect(getPoint(1)?.getAttribute("style")).not.toMatch(/opacity:\s*0\.6/);
    // Point 2 (x=30) - Not hovered, should be dimmed
    expect(getPoint(2)?.getAttribute("style")).toMatch(/opacity:\s*0\.6/);
  });
});
