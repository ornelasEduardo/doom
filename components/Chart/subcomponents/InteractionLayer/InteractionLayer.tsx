"use strict";

import { useMemo } from "react";

import { useChartContext } from "../../context";
import { resolveAccessor } from "../../utils/accessors";
import { findNearestDataPoint } from "../../utils/interaction";
import { createScales } from "../../utils/scales";
import styles from "./InteractionLayer.module.scss";

export function InteractionLayer() {
  const { data, width, height, config, x, y, setHoverState, isMobile } =
    useChartContext();

  const { margin } = config;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Re-create scale just for finding data points
  // Optimization: In a real app, this should probably be shared via context
  // but creating scales is relatively cheap.
  const scaleCtx = useMemo(() => {
    if (!x || !y || !data.length || innerWidth <= 0 || innerHeight <= 0) {
      return null;
    }
    return createScales(
      data,
      width,
      height,
      margin,
      resolveAccessor(x),
      resolveAccessor(y),
      config.type,
    );
  }, [data, width, height, margin, x, y, innerWidth, innerHeight, config.type]);

  const handleInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    if (!scaleCtx || !x) {
      return;
    }

    if (
      event.type.startsWith("touch") &&
      (event as React.TouchEvent).cancelable
    ) {
      event.preventDefault(); // Prevent scrolling on touch drag
    }

    const { xScale } = scaleCtx;
    const svgRect = (event.currentTarget as Element).getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    if ("touches" in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (
      "changedTouches" in event &&
      (event as React.TouchEvent).changedTouches.length > 0
    ) {
      clientX = (event as React.TouchEvent).changedTouches[0].clientX;
      clientY = (event as React.TouchEvent).changedTouches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    // The rect is inside a <g transform="translate(margin.left, margin.top)">.
    // Its bounding rect already includes the margin offset.
    // pointerX/Y are relative to the rect (the chart drawing area).
    const pointerX = clientX - svgRect.left;
    const pointerY = clientY - svgRect.top;

    // Clamp to chart area
    const clampedX = Math.max(0, Math.min(pointerX, innerWidth));

    const closestData = findNearestDataPoint(
      clampedX,
      data,
      xScale,
      resolveAccessor(x),
    );

    if (closestData) {
      // Calculate X position snapped to the nearest data point (for cursor line)
      let dataPointX = 0;
      if ("bandwidth" in xScale) {
        // Band scale: center of the band
        const bandScale = xScale as {
          (val: string | number): number;
          bandwidth(): number;
        };
        dataPointX =
          bandScale(resolveAccessor(x)(closestData)) + xScale.bandwidth() / 2;
      } else {
        // Linear/point scale: exact data position
        const linearScale = xScale as (val: string | number) => number;
        dataPointX = linearScale(resolveAccessor(x)(closestData));
      }

      setHoverState({
        // Cursor line positions (snapped to data point)
        cursorLineX: dataPointX + margin.left,
        cursorLineY: pointerY + margin.top,
        // Tooltip positions (follow raw mouse position)
        tooltipX: pointerX + margin.left,
        tooltipY: pointerY + margin.top,
        // Data and interaction type
        data: closestData,
        isTouch: event.type.startsWith("touch"),
      });
    }
  };

  const handleLeave = () => {
    setHoverState(null);
  };

  if (innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  return (
    <g transform={`translate(${margin.left}, ${margin.top})`}>
      <rect
        className={styles.overlay}
        height={innerHeight}
        width={innerWidth}
        onMouseLeave={handleLeave}
        onMouseMove={handleInteraction}
        onTouchEnd={handleLeave}
        onTouchMove={handleInteraction}
        onTouchStart={handleInteraction}
      />
    </g>
  );
}

// Wrap in G for margin offset
export function InteractionLayerWrapper() {
  const { config } = useChartContext();
  return (
    <g transform={`translate(${config.margin.left}, ${config.margin.top})`}>
      <InteractionLayerContent />
    </g>
  );
}

function InteractionLayerContent() {
  const { data, width, height, config, x, y, setHoverState } =
    useChartContext();

  const { margin } = config;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const scaleCtx = useMemo(() => {
    if (!x || !y || !data.length || innerWidth <= 0 || innerHeight <= 0) {
      return null;
    }
    return createScales(
      data,
      width,
      height,
      margin,
      resolveAccessor(x),
      resolveAccessor(y),
      config.type,
    );
  }, [data, width, height, margin, x, y, innerWidth, innerHeight, config.type]);

  const handleInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    if (!scaleCtx || !x) {
      return;
    }

    // ... logic
    if (
      event.type.startsWith("touch") &&
      (event as React.TouchEvent).cancelable
    ) {
      event.preventDefault();
    }

    const { xScale } = scaleCtx;
    const svgRect = (event.currentTarget as Element).getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    if ("touches" in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (
      "changedTouches" in event &&
      (event as React.TouchEvent).changedTouches.length > 0
    ) {
      clientX = (event as React.TouchEvent).changedTouches[0].clientX;
      clientY = (event as React.TouchEvent).changedTouches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    // Since this rect is inside the <g transform=...>,
    // the BoundingClientRect of the RECT element is the plot area.
    // But clientX is viewport relative.
    // pointerX relative to this rect is clientX - rect.left.
    const pointerX = clientX - svgRect.left;
    const pointerY = clientY - svgRect.top;

    // Clamp
    const clampedX = Math.max(0, Math.min(pointerX, innerWidth));

    const closestData = findNearestDataPoint(
      clampedX,
      data,
      xScale,
      resolveAccessor(x),
    );

    if (closestData) {
      // Calculate X position snapped to the nearest data point (for cursor line)
      let dataPointX = 0;
      if ("bandwidth" in xScale) {
        const bandScale = xScale as {
          (val: string | number): number;
          bandwidth(): number;
        };
        dataPointX =
          bandScale(resolveAccessor(x)(closestData)) + xScale.bandwidth() / 2;
      } else {
        const linearScale = xScale as (val: string | number) => number;
        dataPointX = linearScale(resolveAccessor(x)(closestData));
      }

      setHoverState({
        cursorLineX: dataPointX + margin.left,
        cursorLineY: pointerY + margin.top,
        tooltipX: pointerX + margin.left,
        tooltipY: pointerY + margin.top,
        data: closestData,
        isTouch: event.type.startsWith("touch"),
      });
    }
  };

  const handleLeave = () => setHoverState(null);

  if (innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  return (
    <rect
      className={styles.overlay}
      height={innerHeight}
      width={innerWidth}
      onMouseLeave={handleLeave}
      onMouseMove={handleInteraction}
      onTouchEnd={handleLeave}
      onTouchMove={handleInteraction}
      onTouchStart={handleInteraction}
    />
  );
}
