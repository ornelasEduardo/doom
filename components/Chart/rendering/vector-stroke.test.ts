import { expect, it } from "vitest";

import { dashedContours } from "./vector-stroke";

const line = [
  {
    points: [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
    ],
    closed: false,
  },
];
it("keeps a zero-length round dash at the start of a dotted path", () => {
  expect(dashedContours(line, [0, 8]).map((c) => c.points[0].x)).toEqual([
    0, 8, 16,
  ]);
});
it("wraps negative offsets and repeats odd dash arrays", () => {
  expect(
    dashedContours(line, [4], -2).map((c) => [
      c.points[0].x,
      c.points.at(-1)!.x,
    ]),
  ).toEqual([
    [2, 6],
    [10, 14],
    [18, 20],
  ]);
});
it("keeps a solid stroke when every dash length is zero", () => {
  expect(dashedContours(line, [0, 0])).toEqual(line);
});
