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
});
