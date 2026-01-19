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
