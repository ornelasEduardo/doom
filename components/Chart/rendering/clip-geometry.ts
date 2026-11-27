export type ClipPolygon = readonly { x: number; y: number }[];
export type ClipRect = { x: number; y: number; width: number; height: number };

const cross = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  p: { x: number; y: number },
) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

/** Canonical winding also handles reflected SVG coordinate systems. */
export function counterclockwise(points: ClipPolygon): ClipPolygon {
  let area = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    area += p.x * q.y - q.x * p.y;
  });
  if (area === 0) {
    return [];
  }
  return area < 0 ? [...points].reverse() : points;
}

/** Intersect convex clip boundaries, retaining their actual edges. */
export function intersectClip(
  subject: ClipPolygon,
  boundary: ClipPolygon,
): ClipPolygon {
  if (subject.length < 3 || boundary.length < 3) {
    return [];
  }
  let result = counterclockwise(subject);
  const edges = counterclockwise(boundary);
  if (!edges.length) {
    return [];
  }
  for (let i = 0; i < edges.length && result.length; i++) {
    const a = edges[i],
      b = edges[(i + 1) % edges.length];
    const next: { x: number; y: number }[] = [];
    let previous = result[result.length - 1];
    let previousDistance = cross(a, b, previous);
    for (const point of result) {
      const distance = cross(a, b, point);
      if (distance >= 0 !== previousDistance >= 0) {
        const t = previousDistance / (previousDistance - distance);
        next.push({
          x: previous.x + t * (point.x - previous.x),
          y: previous.y + t * (point.y - previous.y),
        });
      }
      if (distance >= 0) {
        next.push(point);
      }
      previous = point;
      previousDistance = distance;
    }
    result = next;
  }
  return result;
}

export function clipBounds(points: ClipPolygon): ClipRect {
  if (points.length < 3) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let x = Infinity,
    y = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const point of points) {
    x = Math.min(x, point.x);
    y = Math.min(y, point.y);
    right = Math.max(right, point.x);
    bottom = Math.max(bottom, point.y);
  }
  return { x, y, width: right - x, height: bottom - y };
}

/** Axis-aligned convex intersections can keep using the scissor fast path. */
export function rectangularClip(points: ClipPolygon): boolean {
  return points.every((point, i) => {
    const next = points[(i + 1) % points.length];
    return (
      Math.abs(point.x - next.x) < 1e-7 || Math.abs(point.y - next.y) < 1e-7
    );
  });
}
