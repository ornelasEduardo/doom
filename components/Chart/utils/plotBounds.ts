/** Plot-local bounds shared by spatial indexing and interaction sensors. */
export interface PlotBounds {
  innerWidth: number;
  innerHeight: number;
}

interface Point {
  x: number;
  y: number;
}

interface Rect extends Point {
  width: number;
  height: number;
}

export function isPointInPlot(point: Point, bounds: PlotBounds): boolean {
  return (
    Number.isFinite(bounds.innerWidth) &&
    Number.isFinite(bounds.innerHeight) &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.y >= 0 &&
    point.x <= bounds.innerWidth &&
    point.y <= bounds.innerHeight
  );
}

/** Retains zero-size bars inside the plot so zero values remain navigable. */
export function clipRectToPlot(rect: Rect, bounds: PlotBounds): Rect | null {
  if (
    ![
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      bounds.innerWidth,
      bounds.innerHeight,
    ].every(Number.isFinite) ||
    rect.width < 0 ||
    rect.height < 0
  ) {
    return null;
  }
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const right = Math.min(bounds.innerWidth, rect.x + rect.width);
  const bottom = Math.min(bounds.innerHeight, rect.y + rect.height);
  if (
    right < x ||
    bottom < y ||
    (right === x && rect.width > 0) ||
    (bottom === y && rect.height > 0)
  ) {
    return null;
  }
  return { x, y, width: right - x, height: bottom - y };
}
