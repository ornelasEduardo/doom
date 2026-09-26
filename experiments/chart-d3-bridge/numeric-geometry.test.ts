import { expect, it } from "vitest";

import { createNumericGeometry } from "./numeric-geometry";

it("adopts strided numeric columns and projects arbitrary signed domains without rows", () => {
  const values = new Float64Array([-5, 20, 99, 5, 40, 88]);
  const geometry = createNumericGeometry({
    length: 2,
    x: { values, offset: 0, stride: 3 },
    y: { values, offset: 1, stride: 3 },
    projectX: (x) => (x + 5) / 10,
    projectY: (y) => (40 - y) / 20,
  });
  expect(Array.from(geometry.coordinates)).toEqual([0, 1, 1, 0]);
  expect(Array.from(geometry.positions)).toEqual([0, 1, 1, 0]);
  expect(geometry.patch([{ index: 1, x: 0, y: 30 }])).toEqual([1]);
  expect(Array.from(values)).toEqual([-5, 20, 99, 0, 30, 88]);
  expect(Array.from(geometry.positions)).toEqual([0, 1, 0.5, 0.5]);
  expect(geometry.patch([{ index: 1, x: 0, y: 30 }])).toEqual([]);
});
it("validates all changes before mutation and coalesces repeated identities", () => {
  const values = new Float64Array([1, 2]);
  const geometry = createNumericGeometry({
    length: 1,
    x: { values, stride: 2 },
    y: { values, offset: 1, stride: 2 },
    projectX: (x) => x,
    projectY: (y) => y,
  });
  expect(() =>
    geometry.patch([
      { index: 0, x: 3, y: 4 },
      { index: 1, x: 5, y: 6 },
    ]),
  ).toThrow(RangeError);
  expect(Array.from(values)).toEqual([1, 2]);
  expect(
    geometry.patch([
      { index: 0, x: 3, y: 4 },
      { index: 0, x: 5, y: 6 },
    ]),
  ).toEqual([0]);
  expect(Array.from(values)).toEqual([5, 6]);
});

it("respects Float32 ownership precision and rejects invalid patches atomically", () => {
  const x = new Float32Array([0.1, 0.2]),
    y = new Float64Array([1, 2]);
  const geometry = createNumericGeometry({
    length: 2,
    x: { values: x },
    y: { values: y },
    projectX: (v) => v,
    projectY: (v) => Math.log(v),
  });
  geometry.patch([{ index: 0, x: 0.3, y: 3 }]);
  expect(geometry.coordinates[0]).toBe(Math.fround(0.3));
  expect(() =>
    geometry.patch([
      { index: 0, x: 0.4, y: 4 },
      { index: 1, x: 0.5, y: -1 },
    ]),
  ).toThrow(RangeError);
  expect(x[0]).toBe(Math.fround(0.3));
  expect(y[0]).toBe(3);
});
it("rejects overlapping column ownership that cannot represent independent axes", () => {
  const values = new Float64Array(4);
  expect(() =>
    createNumericGeometry({
      length: 2,
      x: { values },
      y: { values },
      projectX: (x) => x,
      projectY: (y) => y,
    }),
  ).toThrow(RangeError);
});

it("rejects raw GPU overflow before mutating any point", () => {
  const values = new Float64Array([1, 2, 3, 4]);
  const coordinates = new Float64Array([0, 0, 0, 0]);
  const positions = new Float32Array(values);
  const geometry = createNumericGeometry(
    {
      length: 2,
      x: { values, stride: 2 },
      y: { values, stride: 2, offset: 1 },
      projectX: Math.log10,
      projectY: Math.log10,
    },
    { coordinates, positions, encoding: "raw" },
  );
  expect(() =>
    geometry.patch([
      { index: 0, x: 5, y: 6 },
      { index: 1, x: 1e40, y: 7 },
    ]),
  ).toThrow(RangeError);
  expect(Array.from(values)).toEqual([1, 2, 3, 4]);
  expect(Array.from(positions)).toEqual([1, 2, 3, 4]);
});
it("rejects prepared projections that alias owned columns", () => {
  const values = new Float64Array([1, 2]);
  expect(() =>
    createNumericGeometry(
      {
        length: 1,
        x: { values, stride: 2 },
        y: { values, stride: 2, offset: 1 },
        projectX: Math.log10,
        projectY: Math.log10,
      },
      { coordinates: values, positions: new Float32Array(2) },
    ),
  ).toThrow(RangeError);
});

it("rejects non-finite prepared coordinates before they can corrupt an index", () => {
  const values = new Float64Array([1, 2]);
  expect(() =>
    createNumericGeometry(
      {
        length: 1,
        x: { values, stride: 2 },
        y: { values, stride: 2, offset: 1 },
        projectX: (v) => v,
        projectY: (v) => v,
      },
      {
        coordinates: new Float64Array([NaN, 0]),
        positions: new Float32Array(2),
      },
    ),
  ).toThrow(RangeError);
});

it.each(["raw", "projected"] as const)(
  "preserves every prepared finite check for interleaved %s data",
  (encoding) => {
    for (const field of ["values", "coordinates", "positions"] as const) {
      for (const invalid of [NaN, Infinity, -Infinity]) {
        const values = new Float64Array([1, 2]);
        const coordinates = new Float64Array([0, 1]);
        const positions = new Float32Array([0, 1]);
        ({ values, coordinates, positions })[field][1] = invalid;
        expect(() =>
          createNumericGeometry(
            {
              length: 1,
              x: { values, stride: 2 },
              y: { values, offset: 1, stride: 2 },
              projectX: (v) => v,
              projectY: (v) => v,
            },
            { coordinates, positions, encoding },
          ),
        ).toThrow(RangeError);
      }
    }
  },
);
it.each(["raw", "projected"] as const)(
  "rejects prepared coordinate Float32 overflow in %s mode",
  (encoding) => {
    const values = new Float64Array([1, 2]);
    expect(() =>
      createNumericGeometry(
        {
          length: 1,
          x: { values, stride: 2 },
          y: { values, offset: 1, stride: 2 },
          projectX: (v) => v,
          projectY: (v) => v,
        },
        {
          coordinates: new Float64Array([1e40, 0]),
          positions: new Float32Array(2),
          encoding,
        },
      ),
    ).toThrow(RangeError);
  },
);
