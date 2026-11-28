/** Geometry in output/device coordinates, ready for GPU fill/stroke tessellation. */
export type Point = { x: number; y: number };
export type VectorContour = { points: Point[]; closed: boolean };

export interface VectorPath {
  contours: VectorContour[];
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number,
  ): void;
  quadraticCurveTo(x1: number, y1: number, x: number, y: number): void;
  closePath(): void;
}

const DEFAULT_TOLERANCE = 0.25;
// At most 65,536 segments per curve, even for hostile finite inputs. At this
// safety limit (or floating-point precision), tolerance is necessarily best effort.
const MAX_DEPTH = 16;

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function midpoint(a: Point, b: Point): Point {
  // Adding first can overflow even when both inputs and the midpoint are finite.
  return { x: a.x / 2 + b.x / 2, y: a.y / 2 + b.y / 2 };
}

/** Distance to the finite chord; unlike line distance this catches overshoots. */
function nearChord(p: Point, a: Point, b: Point, tolerance: number): boolean {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let px = p.x - a.x;
  let py = p.y - a.y;
  let scale = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(px), Math.abs(py));
  if (scale === 0) {
    return true;
  }
  if (!Number.isFinite(scale)) {
    scale = Math.max(
      Math.abs(a.x),
      Math.abs(a.y),
      Math.abs(b.x),
      Math.abs(b.y),
      Math.abs(p.x),
      Math.abs(p.y),
    );
    dx = b.x / scale - a.x / scale;
    dy = b.y / scale - a.y / scale;
    px = p.x / scale - a.x / scale;
    py = p.y / scale - a.y / scale;
  } else {
    dx /= scale;
    dy /= scale;
    px /= scale;
    py /= scale;
  }
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSquared));
  return Math.hypot(px - t * dx, py - t * dy) <= tolerance / scale;
}

/**
 * Minimal d3-shape context: no SVG, DOM, canvas, or runtime dependencies.
 * Tolerance is measured in the coordinates supplied to the context. Invalid or
 * nonpositive tolerances use 0.25. Nonfinite commands break the current subpath
 * so subsequent geometry cannot bridge a missing-data gap.
 *
 * Closed contours omit a repeated final origin; renderers supply the closing
 * edge. The public contours array is populated as commands arrive.
 */
export function createVectorPath(tolerance = DEFAULT_TOLERANCE): VectorPath {
  const error =
    Number.isFinite(tolerance) && tolerance > 0 ? tolerance : DEFAULT_TOLERANCE;
  const contours: VectorContour[] = [];
  let current: VectorContour | undefined;

  function valid(...values: number[]): boolean {
    if (values.every(Number.isFinite)) {
      return true;
    }
    current = undefined;
    return false;
  }

  function moveTo(x: number, y: number): void {
    if (!valid(x, y)) {
      return;
    }
    current = { points: [{ x, y }], closed: false };
    contours.push(current);
  }

  function append(point: Point): void {
    if (!current) {
      moveTo(point.x, point.y);
      return;
    }
    if (current.closed) {
      const origin = current.points[0];
      moveTo(origin.x, origin.y);
    }
    const points = current!.points;
    if (!samePoint(points[points.length - 1], point)) {
      points.push(point);
    }
  }

  function flatten(points: Point[], depth = 0): void {
    const end = points[points.length - 1];
    // A Bezier lies in its control hull. If every control is within tolerance
    // of the chord, the whole curve lies inside that convex chord capsule.
    if (
      depth === MAX_DEPTH ||
      points.slice(1, -1).every((p) => nearChord(p, points[0], end, error))
    ) {
      append(end);
      return;
    }
    const left = [points[0]];
    const right = [end];
    let row = points;
    while (row.length > 1) {
      row = row.slice(1).map((point, i) => midpoint(row[i], point));
      left.push(row[0]);
      right.push(row[row.length - 1]);
    }
    flatten(left, depth + 1);
    flatten(right.reverse(), depth + 1);
  }

  function curve(controls: Point[], end: Point): void {
    if (!valid(...controls.flatMap((p) => [p.x, p.y]), end.x, end.y)) {
      return;
    }
    // Match the Canvas path convention for a curve with no current point.
    if (!current) {
      moveTo(controls[0].x, controls[0].y);
    }
    const start = current!.closed
      ? current!.points[0]
      : current!.points[current!.points.length - 1];
    flatten([start, ...controls, end]);
  }

  return {
    contours,
    moveTo,
    lineTo(x, y) {
      if (valid(x, y)) {
        append({ x, y });
      }
    },
    bezierCurveTo(x1, y1, x2, y2, x, y) {
      curve(
        [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ],
        { x, y },
      );
    },
    quadraticCurveTo(x1, y1, x, y) {
      curve([{ x: x1, y: y1 }], { x, y });
    },
    closePath() {
      if (!current || current.closed) {
        return;
      }
      const points = current.points;
      if (
        points.length > 1 &&
        samePoint(points[0], points[points.length - 1])
      ) {
        points.pop();
      }
      current.closed = true;
    },
  };
}

/**
 * A bar with circular corners only at its free end. Pass radius=0 for an
 * internal stack segment. Nonpositive dimensions or nonfinite geometry return
 * null; negative radii are square. Matches utils/shapes' radius caps, including
 * the top-only full-height cap. Circular edges use the default 0.25 tolerance,
 * subject to the same finite-work limit as Bezier curves.
 */
export function roundedBarContour(
  x: number,
  y: number,
  width: number,
  height: number,
  end: "top" | "bottom" | "left" | "right",
  radius: number,
): VectorContour | null {
  const right = x + width;
  const bottom = y + height;
  if (
    width <= 0 ||
    height <= 0 ||
    ![x, y, width, height, radius, right, bottom].every(Number.isFinite)
  ) {
    return null;
  }
  const r = Math.max(
    0,
    Math.min(radius, width / 2, end === "top" ? height : height / 2),
  );
  const tl = end === "top" || end === "left" ? r : 0;
  const tr = end === "top" || end === "right" ? r : 0;
  const br = end === "bottom" || end === "right" ? r : 0;
  const bl = end === "bottom" || end === "left" ? r : 0;
  const path = createVectorPath();

  function corner(
    cx: number,
    cy: number,
    radius: number,
    angle: number,
    ex: number,
    ey: number,
  ): void {
    if (radius > 0) {
      // Sagitta = r * (1 - cos(step / 2)); asin form avoids cancellation.
      const step =
        4 * Math.asin(Math.sqrt(Math.min(1, DEFAULT_TOLERANCE / radius / 2)));
      const count = Math.min(
        2 ** MAX_DEPTH,
        Math.max(1, Math.ceil(Math.PI / 2 / step)),
      );
      for (let i = 1; i < count; i++) {
        const a = angle + (Math.PI / 2) * (i / count);
        path.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
      }
    }
    // Exact tangent endpoints keep seams square and avoid trigonometric drift.
    path.lineTo(ex, ey);
  }

  path.moveTo(x + tl, y);
  path.lineTo(right - tr, y);
  corner(right - tr, y + tr, tr, -Math.PI / 2, right, y + tr);
  path.lineTo(right, bottom - br);
  corner(right - br, bottom - br, br, 0, right - br, bottom);
  path.lineTo(x + bl, bottom);
  corner(x + bl, bottom - bl, bl, Math.PI / 2, x, bottom - bl);
  path.lineTo(x, y + tl);
  corner(x + tl, y + tl, tl, Math.PI, x + tl, y);
  path.closePath();
  return path.contours[0];
}
