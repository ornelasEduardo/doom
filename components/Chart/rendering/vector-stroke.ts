import type { VectorShape } from "./gpu-vector";

type Point = { x: number; y: number };
type Contour = { points: readonly Point[]; closed: boolean };
const same = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-8;

/** Split in local coordinates, before any affine transform changes lengths. */
export function dashedContours(
  contours: readonly Contour[],
  pattern: readonly number[],
  offset = 0,
): Contour[] {
  const values = pattern.length % 2 ? [...pattern, ...pattern] : [...pattern];
  const total = values.reduce((a, b) => a + b, 0);
  if (!values.length || total === 0) {
    return [...contours];
  }
  const result: Contour[] = [];
  for (const contour of contours) {
    if (!contour.points.length) {
      continue;
    }
    let phase = ((offset % total) + total) % total;
    let index = 0;
    while (phase > 0 && phase >= values[index]) {
      phase -= values[index];
      index = (index + 1) % values.length;
      if (phase === 0 && values[index] > 0) {
        break;
      }
    }
    let left = values[index] - phase;
    let run: Point[] = [];
    const runs: Point[][] = [];
    const finish = () => {
      if (run.length) {
        runs.push(run);
      }
      run = [];
    };
    const points = contour.closed
      ? [...contour.points, contour.points[0]]
      : contour.points;
    for (let edge = 1; edge < points.length; edge++) {
      const a = points[edge - 1],
        b = points[edge];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (!length) {
        continue;
      }
      let distance = 0;
      while (distance < length) {
        if (runs.length > 100000) {
          throw new RangeError("GPU dash pattern creates too many segments");
        }
        const point = {
          x: a.x + ((b.x - a.x) * distance) / length,
          y: a.y + ((b.y - a.y) * distance) / length,
        };
        if (left <= 0) {
          if (index % 2 === 0) {
            if (!run.length) {
              run.push(point);
            }
            finish();
          }
          index = (index + 1) % values.length;
          left = values[index];
          continue;
        }
        const step = Math.min(left, length - distance);
        if (distance + step === distance) {
          throw new RangeError("GPU dash length is below coordinate precision");
        }
        if (index % 2 === 0) {
          if (!run.length) {
            run.push(point);
          }
          run.push({
            x: a.x + ((b.x - a.x) * (distance + step)) / length,
            y: a.y + ((b.y - a.y) * (distance + step)) / length,
          });
        }
        distance += step;
        left -= step;
      }
    }
    finish();
    if (
      contour.closed &&
      runs.length > 1 &&
      same(runs[0][0], runs.at(-1)!.at(-1)!)
    ) {
      runs[0] = [...runs.pop()!, ...runs[0].slice(1)];
    }
    for (const points of runs) {
      const closed =
        contour.closed && points.length > 1 && same(points[0], points.at(-1)!);
      result.push({ points: closed ? points.slice(0, -1) : points, closed });
    }
  }
  return result;
}

export function strokeMesh(shape: VectorShape, ratio: number): Float32Array {
  const vertices: number[] = [];
  const stroke = shape.stroke!;
  const radius = stroke.width / 2;
  const cap = stroke.lineCap ?? "round",
    join = stroke.lineJoin ?? "round";
  const steps = Math.max(
    12,
    Math.min(
      512,
      Math.ceil(
        Math.PI /
          Math.acos(Math.max(-1, 1 - 0.2 / Math.max(radius * ratio, 0.2))),
      ),
    ),
  );
  const triangle = (a: Point, b: Point, c: Point) =>
    vertices.push(a.x, a.y, b.x, b.y, c.x, c.y);
  const disk = (a: Point) => {
    for (let j = 0; j < steps; j++) {
      const t = (j * Math.PI * 2) / steps,
        u = ((j + 1) * Math.PI * 2) / steps;
      triangle(
        a,
        { x: a.x + radius * Math.cos(t), y: a.y + radius * Math.sin(t) },
        { x: a.x + radius * Math.cos(u), y: a.y + radius * Math.sin(u) },
      );
    }
  };
  const contours = dashedContours(
    shape.contours,
    stroke.dashArray ?? [],
    stroke.dashOffset ?? 0,
  );
  for (const contour of contours) {
    const points = contour.points.filter(
      (p, i, all) => !i || !same(p, all[i - 1]),
    );
    if (!points.length) {
      continue;
    }
    if (points.length === 1) {
      if (cap === "round") {
        disk(points[0]);
      } else if (cap === "square") {
        const p = points[0];
        triangle(
          { x: p.x - radius, y: p.y - radius },
          { x: p.x + radius, y: p.y - radius },
          { x: p.x + radius, y: p.y + radius },
        );
        triangle(
          { x: p.x - radius, y: p.y - radius },
          { x: p.x + radius, y: p.y + radius },
          { x: p.x - radius, y: p.y + radius },
        );
      }
      continue;
    }
    const count = contour.closed ? points.length : points.length - 1;
    for (let i = 0; i < count; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y),
        ux = (b.x - a.x) / length,
        uy = (b.y - a.y) / length;
      const nx = -uy * radius,
        ny = ux * radius;
      const start = !contour.closed && i === 0 && cap === "square" ? radius : 0;
      const end =
        !contour.closed && i === count - 1 && cap === "square" ? radius : 0;
      const p = { x: a.x - ux * start, y: a.y - uy * start },
        q = { x: b.x + ux * end, y: b.y + uy * end };
      triangle(
        { x: p.x + nx, y: p.y + ny },
        { x: q.x + nx, y: q.y + ny },
        { x: q.x - nx, y: q.y - ny },
      );
      triangle(
        { x: p.x + nx, y: p.y + ny },
        { x: q.x - nx, y: q.y - ny },
        { x: p.x - nx, y: p.y - ny },
      );
    }
    if (!contour.closed && cap === "round") {
      disk(points[0]);
      disk(points.at(-1)!);
    }
    for (
      let i = contour.closed ? 0 : 1;
      i < (contour.closed ? points.length : points.length - 1);
      i++
    ) {
      const a = points[(i + points.length - 1) % points.length],
        b = points[i],
        c = points[(i + 1) % points.length];
      if (join === "round") {
        disk(b);
        continue;
      }
      const l1 = Math.hypot(b.x - a.x, b.y - a.y),
        l2 = Math.hypot(c.x - b.x, c.y - b.y);
      const u = { x: (b.x - a.x) / l1, y: (b.y - a.y) / l1 },
        v = { x: (c.x - b.x) / l2, y: (c.y - b.y) / l2 };
      const cross = u.x * v.y - u.y * v.x;
      if (Math.abs(cross) < 1e-10) {
        continue;
      }
      const sign = cross > 0 ? -1 : 1;
      const p = { x: b.x - sign * u.y * radius, y: b.y + sign * u.x * radius };
      const q = { x: b.x - sign * v.y * radius, y: b.y + sign * v.x * radius };
      if (join === "miter") {
        const t = ((q.x - p.x) * v.y - (q.y - p.y) * v.x) / cross;
        const m = { x: p.x + t * u.x, y: p.y + t * u.y };
        if (
          Math.hypot(m.x - b.x, m.y - b.y) <=
          radius * (stroke.miterLimit ?? 4)
        ) {
          triangle(b, p, m);
          triangle(b, m, q);
          continue;
        }
      }
      triangle(b, p, q);
    }
  }
  if (shape.transform) {
    const { a, b, c, d, e, f } = shape.transform;
    for (let i = 0; i < vertices.length; i += 2) {
      const x = vertices[i],
        y = vertices[i + 1];
      vertices[i] = a * x + c * y + e;
      vertices[i + 1] = b * x + d * y + f;
    }
  }
  return new Float32Array(vertices);
}
