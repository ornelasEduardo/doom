"use strict";

import { useChartContext } from "../../context";
import styles from "./Cursor.module.scss";

/**
 * CursorLine renders a vertical line at the hover position.
 * Used to indicate which data point is currently hovered.
 */
export function CursorLine() {
  const { config, hoverState, legendItems, height } = useChartContext();
  const { margin } = config;
  const innerHeight = height - margin.top - margin.bottom;

  // Don't render if no hover state
  if (!hoverState) {
    return null;
  }

  // Check if any series wants to show the cursor
  const showLine = legendItems.some((item) => !item.hideCursor);
  if (!showLine) {
    return null;
  }

  // cursorLineX is relative to SVG, subtract margin for group-local coords
  const cx = hoverState.cursorLineX - margin.left;

  return (
    <line
      className={styles.cursorLine}
      x1={cx}
      x2={cx}
      y1={0}
      y2={innerHeight}
    />
  );
}

/**
 * CursorWrapper is a convenience component that renders CursorLine
 * with the correct margin transform.
 *
 * Note: CursorDots functionality has been moved to individual Series components
 * which now handle their own hover highlighting.
 */
export function CursorWrapper(props: { mode?: "line" | "dots" }) {
  const { config } = useChartContext();

  // "dots" mode is deprecated - Series components handle their own highlighting
  if (props.mode === "dots") {
    return null;
  }

  return (
    <g
      style={{ pointerEvents: "none" }}
      transform={`translate(${config.margin.left}, ${config.margin.top})`}
    >
      <CursorLine />
    </g>
  );
}
