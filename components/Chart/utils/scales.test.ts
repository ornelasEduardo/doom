import { ScaleLinear } from "d3-scale";
import { describe, expect, it } from "vitest";

import { createScales } from "./scales";

describe("createScales", () => {
  const data = [
    { x: 0, y: 0 },
    { x: 10, y: 100 },
  ];
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = 120;
  const height = 120;

  it("creates linear scales for number data", () => {
    const {
      xScale: rawXScale,
      yScale,
      innerWidth,
      innerHeight,
    } = createScales(
      data,
      width,
      height,
      margin,
      (d) => d.x,
      (d) => d.y,
    );

    const xScale = rawXScale as ScaleLinear<number, number>;

    expect(innerWidth).toBe(100);
    expect(innerHeight).toBe(100);

    expect(xScale(0)).toBe(0);
    expect(xScale(10)).toBe(100);

    expect(yScale(0)).toBe(100);
    expect(yScale(100)).toBeLessThan(100);
  });
});
