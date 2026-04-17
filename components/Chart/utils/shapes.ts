export type BarSide = "top" | "right" | "bottom" | "left";

export function createRoundedBarPath(
  xPos: number,
  yPos: number,
  width: number,
  height: number,
  radius: number,
  side: BarSide,
): string {
  if (width <= 0 || height <= 0) {
    return "";
  }

  const x = xPos;
  const y = yPos;
  const w = width;
  const h = height;

  if (side === "top") {
    const r = Math.min(radius, w / 2, h);
    return `M ${x},${y + h} L ${x},${y + r} A ${r},${r} 0 0 1 ${x + r},${y} L ${x + w - r},${y} A ${r},${r} 0 0 1 ${x + w},${y + r} L ${x + w},${y + h} Z`;
  }

  if (side === "right") {
    const r = Math.min(radius, h / 2, w);
    return `M ${x},${y} L ${x + w - r},${y} A ${r},${r} 0 0 1 ${x + w},${y + r} L ${x + w},${y + h - r} A ${r},${r} 0 0 1 ${x + w - r},${y + h} L ${x},${y + h} Z`;
  }

  if (side === "bottom") {
    const r = Math.min(radius, w / 2, h);
    return `M ${x},${y} L ${x + w},${y} L ${x + w},${y + h - r} A ${r},${r} 0 0 1 ${x + w - r},${y + h} L ${x + r},${y + h} A ${r},${r} 0 0 1 ${x},${y + h - r} Z`;
  }

  const r = Math.min(radius, h / 2, w);
  return `M ${x + r},${y} L ${x + w},${y} L ${x + w},${y + h} L ${x + r},${y + h} A ${r},${r} 0 0 1 ${x},${y + h - r} L ${x},${y + r} A ${r},${r} 0 0 1 ${x + r},${y} Z`;
}
