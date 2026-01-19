"use strict";

import { useMemo } from "react";

import { useChartContext } from "../../context";
import { resolveAccessor } from "../../utils/accessors";
import { createScales } from "../../utils/scales";
import styles from "./Cursor.module.scss";

// Shared logic hook
function useCursorLogic() {
  const { data, width, height, config, hoverState, x, y, legendItems } =
    useChartContext();

  const { margin } = config;
  const innerHeight = height - margin.top - margin.bottom;

  const scaleCtx = useMemo(() => {
    if (!x || !y || !data.length || width <= 0 || height <= 0) {
      return null;
    }
    return createScales(
      data,
      width,
      height,
      margin,
      resolveAccessor(x),
      resolveAccessor(y),
    );
  }, [data, width, height, margin, x, y]);

  if (!hoverState || !scaleCtx) {
    return null;
  }

  // The cursor line X position is stored in cursorLineX (snapped to data point).
  // It's relative to the SVG wrapper, so we subtract margin.left to get local coordinate
  // within this group (which is translated by margin).
  const cx = hoverState.cursorLineX - margin.left;

  return { cx, innerHeight, scaleCtx, hoverState, legendItems, y };
}

export function CursorLine() {
  const ctx = useCursorLogic();
  if (!ctx) {
    return null;
  }
  const { cx, innerHeight, legendItems } = ctx;

  const showLine = legendItems.some((item) => !item.hideCursor);
  if (!showLine) {
    return null;
  }

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

export function CursorDots() {
  const ctx = useCursorLogic();
  if (!ctx) {
    return null;
  }
  const { cx, scaleCtx, hoverState, legendItems, y } = ctx;

  return (
    <>
      {legendItems.map((item, i) => {
        const yAcc = item.yAccessor
          ? resolveAccessor(item.yAccessor)
          : y
            ? resolveAccessor(y)
            : null;
        if (!yAcc || item.hideCursor) {
          return null;
        }

        const yVal = yAcc(hoverState.data);
        const cy = scaleCtx.yScale(yVal);

        return (
          <circle
            key={i}
            className={styles.cursorPoint}
            cx={cx}
            cy={cy}
            fill={item.color || "var(--primary)"}
            r={6}
          />
        );
      })}
    </>
  );
}

// Keep generic wrapper if needed, but we likely use specific ones now.
// Legacy export for backward compat if I used it elsewhere?
// I used CursorWrapper in Chart.tsx. I should update that.

export function CursorWrapper(props: { mode?: "line" | "dots" }) {
  const { config } = useChartContext();
  const Content = props.mode === "dots" ? CursorDots : CursorLine;

  // If no mode, render BOTH?
  // If I want to split them, I should use separate components.
  // If I use CursorWrapper without mode, I render both (legacy behavior).

  if (!props.mode) {
    return (
      <g
        style={{ pointerEvents: "none" }}
        transform={`translate(${config.margin.left}, ${config.margin.top})`}
      >
        <CursorLine />
        <CursorDots />
      </g>
    );
  }

  return (
    <g
      style={{ pointerEvents: "none" }}
      transform={`translate(${config.margin.left}, ${config.margin.top})`}
    >
      <Content />
    </g>
  );
}
