import { describe, expect, it } from "vitest";

import { d3 } from "./d3";
import { findNearestDataPoint } from "./interaction";

describe("findNearestDataPoint", () => {
  interface Datum {
    x: number | string;
    y: number;
  }

  const linearData: Datum[] = [
    { x: 0, y: 10 },
    { x: 10, y: 20 },
    { x: 20, y: 30 },
  ];

  const categoricalData: Datum[] = [
    { x: "A", y: 10 },
    { x: "B", y: 20 },
    { x: "C", y: 30 },
  ];

  it("finds nearest point on linear scale (exact match)", () => {
    const scale = d3.scaleLinear().domain([0, 20]).range([0, 100]);
    const result = findNearestDataPoint(
      50, // x=10 maps to 50
      linearData,
      scale,
      (d) => d.x,
    );
    expect(result).toEqual({ x: 10, y: 20 });
  });

  it("finds nearest point on linear scale (between points)", () => {
    const scale = d3.scaleLinear().domain([0, 20]).range([0, 100]);
    // 0->0, 10->50, 20->100
    // 24 maps to ~4.8. Should check logic.
    // Wait, input to findNearestDataPoint is pixel coordinate (range value).
    // range 0-100.
    // 0 is x=0
    // 50 is x=10
    // 100 is x=20

    // Test 24px (approx x=4.8). Closer to 0 (0px) or 10 (50px)?
    // 24 is closer to 0 than 50? No. 24 is 24 away from 0. 26 away from 50.
    // So closest is 0.

    const result1 = findNearestDataPoint(24, linearData, scale, (d) => d.x);
    expect(result1).toEqual({ x: 0, y: 10 });

    // Test 26px. Closer to 50 (diff 24) than 0 (diff 26).
    const result2 = findNearestDataPoint(26, linearData, scale, (d) => d.x);
    expect(result2).toEqual({ x: 10, y: 20 });
  });

  it("finds nearest point on band scale", () => {
    // 3 items. domain A, B, C. range 0-300.
    // bandwidth = 100 (padding 0 for simplicity)
    const scale = d3
      .scaleBand()
      .domain(["A", "B", "C"])
      .range([0, 300])
      .padding(0);

    // A: [0, 100], center 50
    // B: [100, 200], center 150
    // C: [200, 300], center 250

    // Click at 60 -> A (closest to 50)
    expect(
      findNearestDataPoint(60, categoricalData, scale, (d) => d.x),
    ).toEqual({ x: "A", y: 10 });

    // Click at 110 -> B (closest to 150)
    expect(
      findNearestDataPoint(110, categoricalData, scale, (d) => d.x),
    ).toEqual({ x: "B", y: 20 });
  });

  it("handles out of bounds gracefully (clamping logic is usually external, but bisector handles edges)", () => {
    const scale = d3.scaleLinear().domain([0, 20]).range([0, 100]);

    // Way to the left
    expect(findNearestDataPoint(-100, linearData, scale, (d) => d.x)).toEqual({
      x: 0,
      y: 10,
    });

    // Way to the right
    expect(findNearestDataPoint(200, linearData, scale, (d) => d.x)).toEqual({
      x: 20,
      y: 30,
    });
  });

  it("handles unsorted data robustly (linear scan)", () => {
    // Data unsorted by X: 0, 20, 10.
    // If we used binary search/bisector, searching for 12 might fail to find 10.
    // 0 (0px), 10 (50px), 20 (100px)
    const unsortedData: Datum[] = [
      { x: 0, y: 1 },
      { x: 20, y: 3 },
      { x: 10, y: 2 },
    ];
    const scale = d3.scaleLinear().domain([0, 20]).range([0, 100]);

    // Target x=12 -> 60px.
    // Distances:
    // x=0 (0px): |60-0| = 60
    // x=20 (100px): |60-100| = 40
    // x=10 (50px): |60-50| = 10 -> Closest
    //
    // Binary search on [0, 20, 10] looking for 12:
    // Mid(20) > 12 -> Go Left -> 0.
    // Compare 0 and 20. Closest is 20.
    // Would miss 10.

    const result = findNearestDataPoint(60, unsortedData, scale, (d) => d.x);
    expect(result).toEqual({ x: 10, y: 2 });
  });
  it("successfully finds visually closest point on Log scale using pixel distance metric", () => {
    // Log Scale: 1 -> 0px, 10 -> 50px, 100 -> 100px
    const logData: Datum[] = [
      { x: 1, y: 10 },
      { x: 100, y: 100 },
    ];
    const scale = d3.scaleLog().domain([1, 100]).range([0, 100]);

    // Pixel 55. Slightly closer to 100px (val 100) than 0px (val 1).
    // Invert(55): x ~= 12.58
    // Dist to 1: |1 - 12.58| = 11.58
    // Dist to 100: |100 - 12.58| = 87.42
    // Old Algorithm picked 1 because 11.58 < 87.42.
    // New Algorithm checks pixel diff: |55 - 0| = 55 vs |55 - 100| = 45.
    // Should pick 100.

    const result = findNearestDataPoint(55, logData, scale, (d) => d.x);

    // Correct behavior:
    expect(result).toEqual({ x: 100, y: 100 });
  });
});
