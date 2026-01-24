"use strict";

import { useChartContext } from "../../context";
import { useSeries } from "../../state/store/stores/series/series.store";
import styles from "./Cursor.module.scss";

/**
 * CursorLine renders a vertical line at the hover position.
 * Used to indicate which data point is currently hovered.
 */
export function CursorLine() {
  const { config, hoverState, height } = useChartContext();
  const series = useSeries();
  const shouldShow =
    series.length > 0 && series.some((s) => s.hideCursor !== true);

  const { margin } = config;
  const innerHeight = height - margin.top - margin.bottom;

  if (!hoverState) {
    return null;
  }

  // Check if any registered series wants to show the cursor
  if (!shouldShow || innerHeight <= 0) {
    return null;
  }

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
