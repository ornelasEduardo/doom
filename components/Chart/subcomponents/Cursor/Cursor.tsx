"use client";

import { CursorOptions } from "../../behaviors/Cursor";
import { useChartContext } from "../../context";
import { HoverInteraction, InteractionChannel } from "../../types/interaction";
import styles from "./Cursor.module.scss";

/**
 * CursorLine renders a vertical line at the hover position.
 * Used to indicate which data point is currently hovered.
 */
export function CursorLine() {
  const { chartStore } = useChartContext();
  const series = chartStore.useStore((s) => s.processedSeries);
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const interactions = chartStore.useStore((s) => s.interactions);

  const cursorConfig = interactions.get(
    InteractionChannel.CURSOR_CONFIG,
  ) as CursorOptions;
  const on = cursorConfig?.on || InteractionChannel.PRIMARY_HOVER;
  const hover = interactions.get(on) as HoverInteraction;

  // If no cursor config, don't show
  if (!cursorConfig) {
    return null;
  }

  const shouldShow =
    series.length > 0 &&
    series.some((s: any) => s.hideCursor !== true) &&
    cursorConfig.showX !== false;

  const { innerWidth, innerHeight } = dimensions;

  // Use primary target or first target in list
  const target = hover?.targets?.[0] ?? null;
  // Use pointer for fallback or if target is missing
  let point = target ? target.coordinate : ((hover?.pointer as any) ?? null);

  // Normalize point to plot-relative coordinates consistently
  if (target && point) {
    point = {
      x: point.x - dimensions.margin.left,
      y: point.y - dimensions.margin.top,
    };
  }

  if (!point) {
    return null;
  }

  if (!shouldShow || innerHeight <= 0) {
    return null;
  }

  return (
    <>
      {cursorConfig.showX !== false && (
        <line
          className={styles.cursorLine}
          x1={point.x}
          x2={point.x}
          y1={0}
          y2={innerHeight}
        />
      )}
      {cursorConfig.showY && (
        <line
          className={styles.cursorLine}
          x1={0}
          x2={innerWidth}
          y1={point.y}
          y2={point.y}
        />
      )}
    </>
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
  if (props.mode === "dots") {
    return null;
  }

  return (
    <g style={{ pointerEvents: "none" }}>
      <CursorLine />
    </g>
  );
}
