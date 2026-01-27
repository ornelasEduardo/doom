export interface TooltipPosition {
  x: number;
  y: number;
  isTouch?: boolean;
  source?: "mouse" | "touch";
}

export interface TooltipProps<T = any> {
  /** Container ref for boundary calculations */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Custom tooltip renderer */
  renderTooltip?: (data: T) => React.ReactNode;
}
