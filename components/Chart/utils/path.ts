import { CurveFactory } from "d3-shape";

import { Accessor } from "../types";
import { d3 } from "./d3";

export function createLinePath<T>(
  data: T[],
  x: Accessor<T, number>,
  y: Accessor<T, number>,
  curve?: CurveFactory,
  defaultCurve?: CurveFactory,
): string | null {
  console.log("createLinePath", { dataLength: data.length });
  const lineGenerator = d3
    .line<T>()
    .x(x as any)
    .y(y as any)
    .curve(curve || defaultCurve || d3.curveLinear);

  return lineGenerator(data);
}

export function createAreaPath<T>(
  data: T[],
  x: Accessor<T, number>,
  y: Accessor<T, number>,
  y0: number,
  curve?: CurveFactory,
  defaultCurve?: CurveFactory,
): string | null {
  const areaGenerator = d3
    .area<T>()
    .x(x as any)
    .y0(y0)
    .y1(y as any)
    .curve(curve || defaultCurve || d3.curveLinear);

  return areaGenerator(data);
}

export function createRoundedTopBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  // Ensure radius isn't larger than half the width or height
  const r = Math.min(radius, width / 2, height);

  // M x, y+height (bottom left)
  // L x, y+r (top left start)
  // A r,r 0 0 1 x+r, y (top left curve)
  // L x+width-r, y (top right start)
  // A r,r 0 0 1 x+width, y+r (top right curve)
  // L x+width, y+height (bottom right)
  // Z (close)

  return `
    M ${x},${y + height}
    L ${x},${y + r}
    A ${r},${r} 0 0 1 ${x + r},${y}
    L ${x + width - r},${y}
    A ${r},${r} 0 0 1 ${x + width},${y + r}
    L ${x + width},${y + height}
    Z
  `
    .replace(/\s+/g, " ")
    .trim();
}
