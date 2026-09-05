/**
 * Creates an SVG path for a rectangle with rounded top corners.
 */
export function createRoundedTopBarPath(
  xPos: number,
  yPos: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = Math.min(radius, width / 2, height);
  // Ensure height is at least something if data is 0?
  // If height is 0, path might be weird.
  if (height <= 0) {
    return "";
  }

  return `
    M ${xPos},${yPos + height}
    L ${xPos},${yPos + r}
    A ${r},${r} 0 0 1 ${xPos + r},${yPos}
    L ${xPos + width - r},${yPos}
    A ${r},${r} 0 0 1 ${xPos + width},${yPos + r}
    L ${xPos + width},${yPos + height}
    Z
  `;
}

/** A bar's free end faces away from zero; shared stack seams remain square. */
export function createBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  end: "top" | "bottom" | "left" | "right",
  radius: number,
): string {
  if (end === "top") {
    return createRoundedTopBarPath(x, y, width, height, radius);
  }
  if (width <= 0 || height <= 0) {
    return "";
  }
  const r = Math.min(radius, width / 2, height / 2);
  const tl = end === "left" ? r : 0;
  const tr = end === "right" ? r : 0;
  const br = end === "bottom" || end === "right" ? r : 0;
  const bl = end === "bottom" || end === "left" ? r : 0;
  return `M ${x + tl},${y} L ${x + width - tr},${y}
    A ${tr},${tr} 0 0 1 ${x + width},${y + tr} L ${x + width},${y + height - br}
    A ${br},${br} 0 0 1 ${x + width - br},${y + height} L ${x + bl},${y + height}
    A ${bl},${bl} 0 0 1 ${x},${y + height - bl} L ${x},${y + tl}
    A ${tl},${tl} 0 0 1 ${x + tl},${y} Z`;
}
