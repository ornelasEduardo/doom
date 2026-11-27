import { expect, it } from "vitest";

import { counterclockwise, intersectClip } from "./clip-geometry";

it("rejects a collapsed ancestor boundary instead of retaining the descendant clip", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const collapsed = Array.from({ length: 4 }, () => ({ x: 20, y: 20 }));
  expect(counterclockwise(collapsed)).toEqual([]);
  expect(intersectClip(square, collapsed)).toEqual([]);
  expect(intersectClip(collapsed, square)).toEqual([]);
});
