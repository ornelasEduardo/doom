/**
 * Reposition utility exports
 */

export type {
  AlignOptions,
  Dimensions,
  EdgeDetectOptions,
  GapOptions,
  HorizontalAlign,
  Placement,
  Point,
  RepositionResult,
  VerticalAlign,
} from "./Reposition";
export { Reposition } from "./Reposition";

// Re-export edge detection internals for advanced usage
export type {
  EdgeCorrectedPosition,
  EdgeDetectionInput,
  OverflowCheckInput,
  OverflowResult,
} from "./edgeDetection";
export {
  checkOverflow,
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
  toTransformString,
  TOUCH_OFFSET_Y,
  VIEWPORT_MARGIN,
} from "./edgeDetection";
