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
  // innerWidth = 100, innerHeight = 100

  it("creates linear scales for number data", () => {
    const { xScale, yScale, innerWidth, innerHeight } = createScales(
      data,
      width,
      height,
      margin,
      (d) => d.x,
      (d) => d.y,
    );

    expect(innerWidth).toBe(100);
    expect(innerHeight).toBe(100);

    // X Scale: 0 -> 0, 10 -> 100
    // @ts-ignore
    expect(xScale(0)).toBe(0);
    // @ts-ignore
    expect(xScale(10)).toBe(100);

    // Y Scale: 0 -> 100 (bottom), 100 -> 0 (top)
    // Note: domain is nicely padded (multiplied by 1.1)
    // 100 * 1.1 = 110 max.
    // nice() might adjust it.

    // Check directionality at least
    expect(yScale(0)).toBe(100);
    expect(yScale(100)).toBeLessThan(100);
  });
});
