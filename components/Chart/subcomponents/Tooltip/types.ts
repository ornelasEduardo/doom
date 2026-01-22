export interface TooltipPosition {
  x: number;
  y: number;
  isTouch?: boolean;
  source?: "mouse" | "touch";
}

export interface TooltipProps<T = any> {
  /** Active data point to display */
  activeData: T;
  /** Position of the anchor (from hover state) */
  position: TooltipPosition | null;
  /** Container ref for boundary calculations */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Custom tooltip renderer */
  renderTooltip?: (data: T) => React.ReactNode;
}
