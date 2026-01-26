import { describe, expect, it } from "vitest";

import { ChartState } from "../../state/store/chart.store";
import { d3 } from "../../utils/d3";
import { findClosestTargets } from "./search";

describe("findClosestTargets - Interaction Radius", () => {
  const xScale = d3.scaleLinear().domain([0, 100]).range([0, 100]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([100, 0]);

  const mockState: Partial<ChartState> = {
    processedSeries: [
      {
        id: "s1",
        data: [{ x: 50, y: 50 }],
        xAccessor: (d: any) => d.x,
        yAccessor: (d: any) => d.y,
        color: "red",
        strategy: {
          find: (chartX, chartY, radius, xScale, yScale) => {
            // Mock strategy calculation
            // Simple distance check against the single point (50, 50)
            const dx = Math.abs(chartX - 50);
            const dy = Math.abs(chartY - 50);
            // distance
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= radius) {
              return {
                data: { x: 50, y: 50 },
                coordinate: { x: 50, y: 50 },
                seriesId: "s1",
              };
            }
            return null;
          },
        },
      },
      {
        id: "s2",
        data: [{ x: 50, y: 50 }], // Same point, second series
        xAccessor: (d: any) => d.x,
        yAccessor: (d: any) => d.y,
        color: "blue",
        strategy: {
          find: (chartX, chartY, radius, xScale, yScale) => {
            const dx = Math.abs(chartX - 50);
            const dy = Math.abs(chartY - 50);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
              return {
                data: { x: 50, y: 50 },
                coordinate: { x: 50, y: 50 },
                seriesId: "s2",
              };
            }
            return null;
          },
        },
      },
    ] as any,
    scales: { x: xScale, y: yScale } as any,
    data: [],
  };

  it("filters out targets outside the interaction radius (50px)", () => {
    // Point at roughly (50, 50) px.
    // Cursor at (50, 150) px.
    // Dy = 100. Dist = 100.
    // Radius = 50.
    // Should return empty.

    const event = {
      coordinates: { chartX: 50, chartY: 150 },
      nativeEvent: {},
    } as any;

    const targets = findClosestTargets(event, "nearest-x", mockState as any);
    expect(targets).toHaveLength(0);
  });

  it("includes targets within the interaction radius", () => {
    // Cursor at (50, 90) px.
    // Dy = 40. Dist = 40.
    // Radius = 50.
    // Should match.

    const event = {
      coordinates: { chartX: 50, chartY: 90 },
      nativeEvent: {},
    } as any;

    const targets = findClosestTargets(event, "nearest-x", mockState as any);
    expect(targets).toHaveLength(2); // Matches both series
    expect(targets[0].coordinate.x).toBeCloseTo(50);
  });

  it("respects radius even in closest (2D) mode", () => {
    // Cursor at (100, 100).
    // Point (50, 50).
    // Dx = 50, Dy=50. Dist = ~70.7.
    // Radius = 50.
    // Should fail.

    const event = {
      coordinates: { chartX: 100, chartY: 100 },
      nativeEvent: {},
    } as any;

    const targets = findClosestTargets(event, "closest", mockState as any);
    expect(targets).toHaveLength(0);
  });
});
