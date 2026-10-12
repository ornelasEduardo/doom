import {
  buildGrid,
  type GridBuffers,
} from "../../components/Chart/engine/PreparedGrid";

export function createCompactData(count: number): GridBuffers {
  if (!Number.isInteger(count) || count < 1 || count > 1000000) {
    throw new RangeError("Point count must be between 1 and 1,000,000");
  }
  const coordinates = new Float64Array(count * 2);
  let seed = 123456789;
  for (let index = 0; index < coordinates.length; index++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    coordinates[index] = seed / 4294967296;
  }
  return buildGrid(coordinates);
}
export function nearestCompact(
  grid: GridBuffers,
  x: number,
  y: number,
  radius: number,
  scaleX = 1,
  scaleY = 1,
) {
  if (
    ![x, y, radius, scaleX, scaleY].every(Number.isFinite) ||
    radius < 0 ||
    scaleX <= 0 ||
    scaleY <= 0
  ) {
    return undefined;
  }
  const radiusX = radius / scaleX,
    radiusY = radius / scaleY;
  const cell = (value: number, min: number, span: number) =>
    Math.max(
      0,
      Math.min(grid.cells - 1, Math.floor(((value - min) / span) * grid.cells)),
    );
  const left = cell(x - radiusX, grid.minX, grid.width),
    right = cell(x + radiusX, grid.minX, grid.width);
  const top = cell(y - radiusY, grid.minY, grid.height),
    bottom = cell(y + radiusY, grid.minY, grid.height);
  let best: number | undefined,
    distance = radius * radius;
  for (let row = top; row <= bottom; row++) {
    for (let column = left; column <= right; column++) {
      for (
        let index = grid.heads[row * grid.cells + column];
        index !== -1;
        index = grid.next[index]
      ) {
        const dx = grid.coordinates[index * 2] - x,
          dy = grid.coordinates[index * 2 + 1] - y;
        const next = (dx * scaleX) ** 2 + (dy * scaleY) ** 2;
        if (
          next < distance ||
          (next === distance && (best === undefined || index < best))
        ) {
          best = index;
          distance = next;
        }
      }
    }
  }
  return best;
}
