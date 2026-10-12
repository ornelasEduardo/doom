// @vitest-environment node
import {
  area,
  curveBasis,
  curveCardinal,
  curveLinear,
  curveMonotoneX,
  curveStep,
  line,
} from "d3-shape";
import { describe, expect, it } from "vitest";

import { createVectorPath, type Point, roundedBarContour } from "./vector-path";

// Independent oracle: evaluate Bernstein polynomials, then measure distance to
// the output segments. This does not reuse subdivision or flatness decisions.
function cubic(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const s = 1 - t;
  return {
    x: s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x,
    y: s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y,
  };
}
function distance(p: Point, points: Point[]): number {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy) || 0,
      ),
    );
    best = Math.min(best, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
  }
  return best;
}

// An analytic sampling sink used with the real D3 generators, not a mock of D3.
function sampledPath() {
  const contours: Point[][] = [];
  let points: Point[] = [];
  return {
    contours,
    moveTo(x: number, y: number) {
      points = [{ x, y }];
      contours.push(points);
    },
    lineTo(x: number, y: number) {
      points.push({ x, y });
    },
    bezierCurveTo(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x: number,
      y: number,
    ) {
      const a = points[points.length - 1];
      for (let i = 1; i <= 100; i++) {
        points.push(
          cubic(a, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }, i / 100),
        );
      }
    },
    closePath() {
      points.push(points[0]);
    },
  };
}

describe("createVectorPath", () => {
  it("preserves separate subpaths and represents closure without a duplicate endpoint", () => {
    const path = createVectorPath();
    path.closePath();
    path.moveTo(1, 2);
    path.lineTo(4, 2);
    path.lineTo(4, 8);
    path.lineTo(1, 2);
    path.closePath();
    path.moveTo(10, 20);
    path.lineTo(12, 24);
    expect(path.contours).toEqual([
      {
        points: [
          { x: 1, y: 2 },
          { x: 4, y: 2 },
          { x: 4, y: 8 },
        ],
        closed: true,
      },
      {
        points: [
          { x: 10, y: 20 },
          { x: 12, y: 24 },
        ],
        closed: false,
      },
    ]);
  });

  it("continues after close from the subpath origin without reopening its polygon", () => {
    const path = createVectorPath();
    path.moveTo(0, 0);
    path.lineTo(4, 5);
    path.closePath();
    path.closePath();
    path.lineTo(9, 9);
    expect(path.contours[0].closed).toBe(true);
    expect(path.contours[1]).toEqual({
      points: [
        { x: 0, y: 0 },
        { x: 9, y: 9 },
      ],
      closed: false,
    });
  });

  it.each([
    ["arch", { x: 0, y: 150 }, { x: 100, y: 150 }, { x: 100, y: 0 }],
    ["inflection", { x: 50, y: 200 }, { x: 50, y: -200 }, { x: 100, y: 0 }],
    ["loop", { x: 150, y: 150 }, { x: -150, y: 150 }, { x: 0, y: 0 }],
    [
      "collinear overshoot",
      { x: 200, y: 0 },
      { x: -200, y: 0 },
      { x: 10, y: 0 },
    ],
  ] as const)("bounds cubic error for %s", (_name, b, c, d) => {
    for (const tolerance of [0.25, 0.025]) {
      const path = createVectorPath(tolerance);
      const a = { x: 0, y: 0 };
      path.moveTo(a.x, a.y);
      path.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y);
      const points = path.contours[0].points;
      for (let i = 0; i <= 1000; i++) {
        expect(
          distance(cubic(a, b, c, d, i / 1000), points),
        ).toBeLessThanOrEqual(tolerance + 1e-9);
      }
      expect(points[points.length - 1]).toEqual(d);
    }
  });

  it("bounds quadratic error and adapts point density to tolerance", () => {
    const counts: number[] = [];
    for (const tolerance of [1, 0.01]) {
      const path = createVectorPath(tolerance);
      path.moveTo(0, 0);
      path.quadraticCurveTo(100, 200, 200, 0);
      const points = path.contours[0].points;
      for (let i = 0; i <= 1000; i++) {
        const t = i / 1000;
        expect(
          distance({ x: 200 * t, y: 400 * t * (1 - t) }, points),
        ).toBeLessThanOrEqual(tolerance);
      }
      counts.push(points.length);
    }
    expect(counts[1]).toBeGreaterThan(counts[0]);
  });

  it("does not subdivide straight curves or duplicate consecutive vertices", () => {
    const path = createVectorPath();
    path.lineTo(0, 0);
    path.lineTo(0, 0);
    path.bezierCurveTo(1, 0, 2, 0, 3, 0);
    path.quadraticCurveTo(4, 0, 5, 0);
    expect(path.contours[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 5, y: 0 },
    ]);
  });

  it("breaks on invalid commands so it cannot bridge missing data", () => {
    const path = createVectorPath();
    path.moveTo(0, 0);
    path.lineTo(1, 1);
    path.lineTo(NaN, 2);
    path.lineTo(4, 4);
    path.bezierCurveTo(1, Infinity, 2, 3, 6, 7);
    path.moveTo(8, 8);
    path.quadraticCurveTo(NaN, 1, 9, 9);
    path.moveTo(Infinity, 0);
    path.lineTo(10, 10);
    expect(path.contours.map((c) => c.points)).toEqual([
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      [{ x: 4, y: 4 }],
      [{ x: 8, y: 8 }],
      [{ x: 10, y: 10 }],
    ]);
  });

  it.each([0, -1, NaN, Infinity])(
    "uses the default for invalid tolerance %s",
    (tolerance) => {
      const path = createVectorPath(tolerance);
      path.moveTo(0, 0);
      path.quadraticCurveTo(50, 100, 100, 0);
      expect(
        distance({ x: 50, y: 50 }, path.contours[0].points),
      ).toBeLessThanOrEqual(0.25);
      expect(path.contours[0].points.length).toBeLessThan(100);
    },
  );

  it("bounds work and keeps all vertices finite for huge coordinates and tiny tolerances", () => {
    const path = createVectorPath(Number.MIN_VALUE);
    path.moveTo(-1e308, 1e308);
    path.bezierCurveTo(1e308, 1e308, -1e308, -1e308, 1e308, -1e308);
    expect(path.contours[0].points.length).toBeLessThanOrEqual(65537);
    expect(
      path.contours[0].points.every(
        (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
      ),
    ).toBe(true);
    expect(path.contours[0].points.at(-1)).toEqual({ x: 1e308, y: -1e308 });
  });

  const curves = {
    linear: curveLinear,
    step: curveStep,
    basis: curveBasis,
    cardinal: curveCardinal,
    monotone: curveMonotoneX,
  };
  for (const [name, curve] of Object.entries(curves)) {
    for (const kind of ["line", "area"] as const) {
      it(`collects real D3 ${name} ${kind} geometry within tolerance without bridging gaps`, () => {
        const data: [number, number][] = [
          [0, 10],
          [20, 60],
          [40, 5],
          [60, 40],
          [80, NaN],
          [100, 20],
          [120, 70],
          [140, 10],
        ];
        const path = createVectorPath(0.05),
          reference = sampledPath();
        const generator =
          kind === "line"
            ? line<[number, number]>()
            : area<[number, number]>()
                .y0(-10)
                .y1((d) => d[1]);
        generator.defined((d) => Number.isFinite(d[1])).curve(curve);
        // D3 typings require a full canvas, but these curves use only path methods.
        generator.context(path as unknown as CanvasRenderingContext2D)(data);
        generator.context(reference as unknown as CanvasRenderingContext2D)(
          data,
        );
        expect(path.contours).toHaveLength(2);
        path.contours.forEach((contour, index) => {
          expect(contour.closed).toBe(kind === "area");
          const polyline = contour.closed
            ? [...contour.points, contour.points[0]]
            : contour.points;
          for (const sample of reference.contours[index]) {
            expect(distance(sample, polyline)).toBeLessThanOrEqual(0.05 + 1e-9);
          }
          expect(
            contour.points.every((p) => (index === 0 ? p.x <= 60 : p.x >= 100)),
          ).toBe(true);
        });
      });
    }
  }
});

describe("roundedBarContour", () => {
  it.each(["top", "bottom", "left", "right"] as const)(
    "rounds only the %s free end",
    (end) => {
      const contour = roundedBarContour(10, 20, 40, 30, end, 8)!;
      expect(contour.closed).toBe(true);
      const corners = [
        { x: 10, y: 20 },
        { x: 50, y: 20 },
        { x: 50, y: 50 },
        { x: 10, y: 50 },
      ];
      const square = {
        top: [2, 3],
        bottom: [0, 1],
        left: [1, 2],
        right: [0, 3],
      }[end];
      corners.forEach((corner, i) =>
        square.includes(i)
          ? expect(contour.points).toContainEqual(corner)
          : expect(contour.points).not.toContainEqual(corner),
      );
      expect(
        contour.points.every(
          (p) => p.x >= 10 && p.x <= 50 && p.y >= 20 && p.y <= 50,
        ),
      ).toBe(true);
      expect(contour.points[0]).not.toEqual(contour.points.at(-1));
    },
  );

  it("uses circular corners within 0.25 units, not quadratic corner approximations", () => {
    const contour = roundedBarContour(0, 0, 200, 100, "top", 80)!;
    const boundary = [...contour.points, contour.points[0]];
    for (let i = 0; i <= 1000; i++) {
      const angle = Math.PI + ((Math.PI / 2) * i) / 1000;
      expect(
        distance(
          { x: 80 + 80 * Math.cos(angle), y: 80 + 80 * Math.sin(angle) },
          boundary,
        ),
      ).toBeLessThanOrEqual(0.25 + 1e-9);
    }
  });

  it("preserves the existing asymmetric top radius cap", () => {
    const top = roundedBarContour(0, 0, 100, 10, "top", 50)!;
    const bottom = roundedBarContour(0, 0, 100, 10, "bottom", 50)!;
    expect(top.points).toContainEqual({ x: 10, y: 0 });
    expect(top.points).toContainEqual({ x: 90, y: 0 });
    expect(bottom.points).toContainEqual({ x: 95, y: 10 });
    expect(bottom.points).toContainEqual({ x: 5, y: 10 });
  });

  it.each([0, -10])("keeps stack seams square when radius is %s", (radius) => {
    expect(roundedBarContour(1, 2, 3, 4, "top", radius)).toEqual({
      points: [
        { x: 1, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 6 },
        { x: 1, y: 6 },
      ],
      closed: true,
    });
  });

  it.each([
    [0, 10],
    [10, 0],
    [-1, 10],
    [10, -1],
    [Infinity, 10],
    [10, NaN],
  ])("omits empty or invalid bar dimensions %s, %s", (width, height) => {
    expect(roundedBarContour(0, 0, width, height, "top", 2)).toBeNull();
  });
  it("omits nonfinite and overflowing geometry", () => {
    expect(roundedBarContour(NaN, 0, 10, 10, "top", 2)).toBeNull();
    expect(roundedBarContour(0, 0, 10, 10, "top", Infinity)).toBeNull();
    expect(roundedBarContour(1e308, 0, 1e308, 10, "top", 2)).toBeNull();
  });
});
