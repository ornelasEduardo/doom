"use strict";

import { useEffect, useMemo, useRef } from "react";

import { useChartContext } from "../../context";
import { SeriesProps } from "../../types";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";

export function CustomSeries<T>(props: SeriesProps<T>) {
  const {
    data: contextData,
    width,
    height,
    config,
    x: contextX,
    y: contextY,
    showTooltip,
    hideTooltip,
    setHoverState,
    resolveInteraction,
    isMobile,
  } = useChartContext<T>();

  const { data: localData, x: localX, y: localY, render, color } = props;
  const { margin } = config;

  // Determine effective data and accessors
  const data = localData || contextData;
  const xAccessor =
    (localX ? resolveAccessor(localX) : undefined) || contextX
      ? resolveAccessor(contextX!)
      : undefined;
  const yAccessor =
    (localY ? resolveAccessor(localY) : undefined) || contextY
      ? resolveAccessor(contextY!)
      : undefined;

  // Re-create scales locally just in case the custom render needs them
  // (e.g. mixed types). But for pure custom stuff like Pies, it might be
  // unnecessary overhead. However, our SeriesContext interface expects them.
  const scaleCtx = useMemo(() => {
    if (!data.length || width <= 0 || height <= 0) {
      return null;
    }
    // We try to create linear/point scales if accessors exist,
    // otherwise we might just return defaults or null.
    // Let's rely on createScales robust handling.
    // If no accessors, createScales might fail or default.
    // For custom renders, users might not pass x/y.
    if (xAccessor && yAccessor) {
      return createScales(
        data,
        width,
        height,
        margin,
        xAccessor,
        yAccessor,
        "line", // Default to line/point for scales
      );
    }
    // Minimal fallback context if no accessors
    return {
      xScale: d3.scaleLinear(),
      yScale: d3.scaleLinear(), // Dummy
      innerWidth: width - margin.left - margin.right,
      innerHeight: height - margin.top - margin.bottom,
    };
  }, [data, width, height, margin, xAccessor, yAccessor]);

  const gRef = useRef<SVGGElement>(null);

  // Use a ref to track if we've rendered to handle StrictMode or fast updates
  // avoiding duplicate render calls if not needed, though useEffect deps should handle it.

  useEffect(() => {
    if (!render || !gRef.current || !data.length || width <= 0 || height <= 0) {
      return;
    }

    const selection = d3.select(gRef.current);

    // Clear previous content to allow clean re-render?
    // User's render function uses .enter() pattern which implies it handles updates,
    // but often custom renders just append. To be safe and prevent duplicates if the
    // user isn't handling update selections, we can optionally clear.
    // However, robust D3 should handle it. Given the issue is "constantly re-rendering",
    // simply stopping it from running on hover is the main fix.
    // But if we want to be safe: selection.selectAll("*").remove();
    // might be too aggressive if they want transitions.
    // Let's assume the user's render function is idempotent or we just invoke it less often.
    // Actually, for "custom render", clearing is often expected if it's a fresh draw.
    // Let's stick to just invoking it.

    render({
      g: selection,
      data,
      width,
      height,
      innerWidth: scaleCtx?.innerWidth ?? width - margin.left - margin.right,
      innerHeight: scaleCtx?.innerHeight ?? height - margin.top - margin.bottom,
      margin,
      xScale: scaleCtx?.xScale,
      yScale: scaleCtx?.yScale,
      x: xAccessor,
      y: yAccessor,
      config,
      colors: [color || "var(--primary)"],
      styles: {},
      gradientId: "",
      isMobile,
      showTooltip,
      hideTooltip,
      setHoverState,
      resolveInteraction,
    } as any);

    // Dependencies: We explicitly omit setHoverState/resolveInteraction/utils if they are stable
    // or if we trust them not to change meaningfully.
    // In our Root, these are useCallbacks.
  }, [
    render,
    data,
    width,
    height,
    margin,
    scaleCtx,
    xAccessor,
    yAccessor,
    config,
    color,
    isMobile,
    // callbacks - assuming stable or harmless if they change rarely
    showTooltip,
    hideTooltip,
    setHoverState,
    resolveInteraction,
  ]);

  // We DO NOT register this series. This relies on the Root "fallback legend item" logic
  // which implies no cursor.

  if (!render) {
    return null;
  }

  return (
    <g ref={gRef} transform={`translate(${margin.left}, ${margin.top})`} />
  );
}
