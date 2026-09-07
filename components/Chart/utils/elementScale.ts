/** Ratios between viewport pixels and local border-box pixels, including scaled ancestors. */
export function getElementScale(element: Element | null, rect: DOMRect) {
  let width = 0;
  let height = 0;
  if (element instanceof HTMLElement) {
    const style = getComputedStyle(element);
    const pixels = (value: string) => parseFloat(value) || 0;
    // offsetWidth/Height round away fractional layout pixels and invent a scale
    // even on untransformed charts. Computed sizes retain that precision.
    width = parseFloat(style.width);
    height = parseFloat(style.height);
    if (style.boxSizing !== "border-box") {
      width +=
        pixels(style.paddingLeft) +
        pixels(style.paddingRight) +
        pixels(style.borderLeftWidth) +
        pixels(style.borderRightWidth);
      height +=
        pixels(style.paddingTop) +
        pixels(style.paddingBottom) +
        pixels(style.borderTopWidth) +
        pixels(style.borderBottomWidth);
    }
    if (!Number.isFinite(width)) {
      width = element.offsetWidth;
    }
    if (!Number.isFinite(height)) {
      height = element.offsetHeight;
    }
  }
  return {
    x: width > 0 && rect.width > 0 ? rect.width / width : 1,
    y: height > 0 && rect.height > 0 ? rect.height / height : 1,
  };
}
