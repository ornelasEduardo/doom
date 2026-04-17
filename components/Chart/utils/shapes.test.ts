import { describe, expect, it } from "vitest";

import { createRoundedBarPath } from "./shapes";

describe("createRoundedBarPath", () => {
  it("rounds the top side", () => {
    const path = createRoundedBarPath(10, 20, 40, 100, 5, "top");
    expect(path).toContain("M 10,120");
    expect(path).toContain("A 5,5 0 0 1 15,20");
    expect(path).toContain("A 5,5 0 0 1 50,25");
    expect(path.trim()).toMatch(/Z\s*$/);
  });

  it("rounds the right side for horizontal bars", () => {
    const path = createRoundedBarPath(10, 20, 100, 40, 5, "right");
    expect(path).toContain("M 10,20");
    expect(path).toContain("A 5,5 0 0 1 110,25");
    expect(path).toContain("A 5,5 0 0 1 105,60");
  });

  it("rounds the bottom side", () => {
    const path = createRoundedBarPath(10, 20, 40, 100, 5, "bottom");
    expect(path).toContain("M 10,20");
    expect(path).toContain("A 5,5 0 0 1 45,120");
    expect(path).toContain("A 5,5 0 0 1 10,115");
  });

  it("rounds the left side", () => {
    const path = createRoundedBarPath(10, 20, 100, 40, 5, "left");
    expect(path).toContain("L 110,20");
    expect(path).toContain("A 5,5 0 0 1 10,55");
    expect(path).toContain("A 5,5 0 0 1 15,20");
  });

  it("returns empty string for zero or negative dimensions", () => {
    expect(createRoundedBarPath(0, 0, 10, 0, 5, "top")).toBe("");
    expect(createRoundedBarPath(0, 0, 0, 10, 5, "top")).toBe("");
    expect(createRoundedBarPath(0, 0, -10, 10, 5, "top")).toBe("");
  });

  it("clamps radius to half-width for top/bottom sides", () => {
    const path = createRoundedBarPath(0, 0, 20, 100, 15, "top");
    expect(path).toContain("A 10,10");
  });

  it("clamps radius to height for top/bottom sides", () => {
    const path = createRoundedBarPath(0, 0, 40, 8, 15, "top");
    expect(path).toContain("A 8,8");
  });

  it("clamps radius to half-height for left/right sides", () => {
    const path = createRoundedBarPath(0, 0, 100, 20, 15, "right");
    expect(path).toContain("A 10,10");
  });

  it("produces exactly two arcs per rounded side", () => {
    const path = createRoundedBarPath(10, 20, 40, 100, 5, "top");
    const arcs = path.match(/A \d+,\d+ 0 0 1 \d+,\d+/g);
    expect(arcs).toHaveLength(2);
  });

  it("handles bars at origin", () => {
    const path = createRoundedBarPath(0, 0, 50, 80, 4, "top");
    expect(path).toContain("M 0,80");
  });

  it("handles very small dimensions", () => {
    const path = createRoundedBarPath(0, 0, 2, 3, 1, "top");
    expect(path).toContain("A 1,1");
  });
});
