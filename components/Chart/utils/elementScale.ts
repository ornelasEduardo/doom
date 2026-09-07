/** Ratios between viewport pixels and local border-box pixels, including scaled ancestors. */
export function getElementScale(element: Element | null, rect: DOMRect) {
  const width = element instanceof HTMLElement ? element.offsetWidth : 0;
  const height = element instanceof HTMLElement ? element.offsetHeight : 0;
  return {
    x: width > 0 && rect.width > 0 ? rect.width / width : 1,
    y: height > 0 && rect.height > 0 ? rect.height / height : 1,
  };
}
