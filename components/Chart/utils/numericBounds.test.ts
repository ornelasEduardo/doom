import { expect, it } from "vitest";

import { numericBounds } from "./numericBounds";

it("consumes a single-use stream and ignores non-finite samples", () => {
  function* samples() {
    yield NaN;
    yield -8;
    yield Infinity;
    yield 13;
    yield -Infinity;
  }
  expect(numericBounds(samples())).toEqual([-8, 13]);
  expect(numericBounds([])).toBeUndefined();
  expect(numericBounds([4, 4])).toEqual([4, 4]);
});
