export interface PointerPosition {
  clientX: number;
  clientY: number;
  isTouch: boolean;
}

export interface ChartCoordinates {
  /** X position relative to the Chart Container (for Tooltip) */
  containerX: number;
  /** Y position relative to the Chart Container (for Tooltip) */
  containerY: number;
  /** X position relative to the Plot Area (for Cursor/Grid) */
  chartX: number;
  /** Y position relative to the Plot Area (for Cursor/Grid) */
  chartY: number;
  /** Whether the pointer is currently inside the Plot Area */
  isWithinPlot: boolean;
}

/**
 * Normalizes a mouse/touch event into chart-relative coordinates.
 *
 * @param event - The React or native mouse/touch event
 * @param containerRect - The bounding box of the main Chart Container (HTML)
 * @param plotRect - The bounding box of the Plot Area (SVG)
 * @returns Normalized coordinates or null if invalid event
 */
export function normalizeCoordinates(
  event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  containerRect: DOMRect,
  plotRect: DOMRect,
  containerBorder: { left: number; top: number } = { left: 0, top: 0 },
): ChartCoordinates | null {
  let clientX: number;
  let clientY: number;
  let isTouch = false;

  // Extract client coordinates
  if ("changedTouches" in event && event.changedTouches.length > 0) {
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
    isTouch = true;
  } else if ("touches" in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
    isTouch = true;
  } else if ("clientX" in event) {
    clientX = (event as MouseEvent).clientX;
    clientY = (event as MouseEvent).clientY;
  } else {
    return null;
  }

  // Calculate coordinates relative to Container (Padding Box)
  // We subtract the border width because absolute positioning (left: 0, top: 0)
  // starts at the padding box, inside the border.
  const containerX = clientX - containerRect.left - containerBorder.left;
  const containerY = clientY - containerRect.top - containerBorder.top;

  // Relative to Plot Area
  const chartX = clientX - plotRect.left;
  const chartY = clientY - plotRect.top;

  const isWithinPlot =
    chartX >= 0 &&
    chartX <= plotRect.width &&
    chartY >= 0 &&
    chartY <= plotRect.height;

  return {
    containerX,
    containerY,
    chartX,
    chartY,
    isWithinPlot,
  };
}
