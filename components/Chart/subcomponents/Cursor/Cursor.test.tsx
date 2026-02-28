import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../context";
import { InteractionType } from "../../types/interaction";
import { CursorLine, CursorWrapper } from "./Cursor";

const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("Cursor", () => {
  const mockInteractionState = {
    interactions: new Map([
      [
        InteractionType.HOVER,
        {
          pointer: { x: 60, y: 50, isTouch: false },
          target: {
            coordinate: { x: 50, y: 50 },
            data: { x: 50, y: 20 },
          },
        },
      ],
    ]),
  };

  const defaultContext = {
    data: [
      { x: 0, y: 10 },
      { x: 50, y: 20 },
      { x: 100, y: 5 },
    ],
    width: 100,
    height: 100,
    config: { margin: { top: 10, left: 10, right: 10, bottom: 10 } },
    x: (d: any) => d.x,
    y: (d: any) => d.y,

    interactionStore: {
      useStore: (selector: any) => selector(mockInteractionState),
      getState: () => mockInteractionState,
    },

    seriesStore: {
      getState: () => ({ series: new Map(), processedSeries: [] }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      useStore: (selector: any) => {
        const state = {
          series: new Map(),
          processedSeries: [{ id: "series1", hideCursor: false }],
        };
        return selector(state);
      },
    },
    chartStore: {
      getState: () => ({
        series: new Map(),
        processedSeries: [{ id: "series1", hideCursor: false }],
        interactions: new Map([
          ["cursor-config", { on: "primary-hover", showX: true }],
          [
            "primary-hover",
            {
              pointer: { x: 60, y: 50, isTouch: false },
              target: {
                coordinate: { x: 50, y: 50 },
                data: { x: 50, y: 20 },
              },
              targets: [
                {
                  coordinate: { x: 50, y: 50 },
                  data: { x: 50, y: 20 },
                },
              ],
            },
          ],
        ]),
        scales: { x: (val: any) => val, y: (val: any) => val },
        dimensions: {
          width: 100,
          height: 100,
          innerHeight: 80,
          margin: { top: 10, left: 10, right: 10, bottom: 10 },
        },
      }),
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      useStore: (selector: any) =>
        selector({
          series: new Map(),
          processedSeries: [{ id: "series1", hideCursor: false }],
          interactions: new Map([
            ["cursor-config", { on: "primary-hover", showX: true }],
            [
              "primary-hover",
              {
                pointer: { x: 60, y: 50, isTouch: false },
                target: {
                  coordinate: { x: 50, y: 50 },
                  data: { x: 50, y: 20 },
                },
                targets: [
                  {
                    coordinate: { x: 50, y: 50 },
                    data: { x: 50, y: 20 },
                  },
                ],
              },
            ],
          ]),
          scales: { x: (val: any) => val, y: (val: any) => val },
          dimensions: {
            width: 100,
            height: 100,
            innerHeight: 80,
            margin: { top: 10, left: 10, right: 10, bottom: 10 },
          },
        }),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cursor line when hover target is present", () => {
    useChartContextMock.mockReturnValue(defaultContext);

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toBeInTheDocument();
    expect(line).toHaveAttribute("x1", "40");
    expect(line).toHaveAttribute("x2", "40");
  });

  it("renders nothing when hover target is null", () => {
    const emptyState = { interactions: new Map() };
    useChartContextMock.mockReturnValue({
      ...defaultContext,
      chartStore: {
        ...defaultContext.chartStore,
        useStore: (selector: any) =>
          selector({
            series: new Map(),
            processedSeries: [], // No series
            interactions: new Map(), // Empty interactions
            scales: { x: (val: any) => val, y: (val: any) => val },
            dimensions: {
              width: 100,
              height: 100,
              innerHeight: 100,
              margin: { top: 0, left: 0, right: 0, bottom: 0 },
            },
          }),
      },
    });

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    expect(container.querySelector("line")).not.toBeInTheDocument();
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
            series: new Map(),
            processedSeries: [{ id: "series1", hideCursor: false }],
            interactions: new Map(), // irrelevant if dims zero, but for consistency
            scales: { x: (val: any) => val, y: (val: any) => val },
            dimensions: {
              width: 0,
              height: 0,
              innerHeight: 0,
              margin: { top: 0, left: 0, right: 0, bottom: 0 },
            },
          }),
      },
    });

    const { container } = render(
      <svg>
        <CursorWrapper />
      </svg>,
    );

    expect(container.querySelector("line")).not.toBeInTheDocument();
  });

  describe("cursor line positioning", () => {
    it("uses target coordinate X for line position", () => {
      const specificState = {
        interactions: new Map([
          [
            InteractionType.HOVER,
            {
              pointer: { x: 100, y: 50 },
              target: {
                coordinate: { x: 70, y: 50 },
                data: { x: 50, y: 20 },
              },
            },
          ],
        ]),
      };

      useChartContextMock.mockReturnValue({
        ...defaultContext,
        chartStore: {
          ...defaultContext.chartStore,
          useStore: (selector: any) =>
            selector({
              series: new Map(),
              processedSeries: [{ id: "series1", hideCursor: false }],
              interactions: new Map([
                ["cursor-config", { on: "primary-hover", showX: true }],
                [
                  "primary-hover",
                  {
                    pointer: { x: 100, y: 50, isTouch: false },
                    target: {
                      coordinate: { x: 70, y: 50 },
                      data: { x: 50, y: 20 },
                    },
                    targets: [
                      {
                        coordinate: { x: 70, y: 50 },
                        data: { x: 50, y: 20 },
                      },
                    ],
                  },
                ],
              ]),
              scales: { x: (val: any) => val, y: (val: any) => val },
              dimensions: {
                width: 100,
                height: 100,
                innerHeight: 80,
                margin: { top: 10, left: 10, right: 10, bottom: 10 },
              },
            }),
        },
      });

      const { container } = render(
        <svg>
          <CursorWrapper />
        </svg>,
      );

      const line = container.querySelector("line");
      expect(line).toHaveAttribute("x1", "60");
      expect(line).toHaveAttribute("x2", "60");
    });

    it("does not render cursor line when series hides cursor", () => {
      useChartContextMock.mockReturnValue({
        ...defaultContext,
        chartStore: {
          ...defaultContext.chartStore,
          useStore: (selector: any) =>
            selector({
              series: new Map(),
              processedSeries: [{ id: "series1", hideCursor: true }],
              interactions: new Map([
                ["cursor-config", { on: "primary-hover", showX: true }],
                [
                  "primary-hover",
                  {
                    pointer: { x: 60, y: 50, isTouch: false },
                    target: {
                      coordinate: { x: 50, y: 50 },
                      data: { x: 50, y: 20 },
                    },
                    targets: [],
                  },
                ],
              ]),
              scales: { x: (val: any) => val, y: (val: any) => val },
              dimensions: { width: 100, height: 100, innerHeight: 80 },
            }),
        },
      });

      const { container } = render(
        <svg>
          <CursorLine />
        </svg>,
      );

      expect(container.querySelector("line")).not.toBeInTheDocument();
    });

    it("line extends from top to bottom of chart area", () => {
      useChartContextMock.mockReturnValue(defaultContext);

      const { container } = render(
        <svg>
          <CursorWrapper />
        </svg>,
      );

      const line = container.querySelector("line");
      expect(line).toHaveAttribute("y1", "0");
      // height (100) - top (10) - bottom (10) = 80
      expect(line).toHaveAttribute("y2", "80");
    });
  });
});
