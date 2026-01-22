"use strict";

import { useRef } from "react";

import { useEventContext } from "../../state/EventContext";
import { normalizeCoordinates } from "../../utils/coordinates";

export function InputSensor() {
  const { emit } = useEventContext();

  const observerRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handlePointerEvent = (
    event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
    type:
      | "CHART_POINTER_MOVE"
      | "CHART_POINTER_DOWN"
      | "CHART_POINTER_UP"
      | "CHART_POINTER_LEAVE",
  ) => {
    // We need to get the Container and Plot rects.
    // In this "Sensor" component, we can assume it covers the entire Chart area (or Plot area).
    // If we place InputSensor inside Root's main div, it can capture events.
    // BUT, we need to know where the PLOT is to calculate chartX/chartY correctly.

    const container = observerRef.current?.closest(
      "[data-chart-container]",
    ) as HTMLElement;
    // Try to find the svg plot.
    const svg = container?.querySelector("[data-chart-plot]") as SVGSVGElement;
    // Try to find the inner plot group (where grid/series are drawn)
    // This is the <g> element translated by margin.left/top
    const innerPlotGroup = svg?.querySelector("g") as SVGGElement;

    if (!container || !svg) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    // Use the inner plot group if available, otherwise fall back to SVG
    const plotRect = innerPlotGroup
      ? innerPlotGroup.getBoundingClientRect()
      : svg.getBoundingClientRect();

    const containerStyle = window.getComputedStyle(container);
    const borderLeft = parseFloat(containerStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(containerStyle.borderTopWidth) || 0;

    const coords = normalizeCoordinates(event, containerRect, plotRect, {
      left: borderLeft,
      top: borderTop,
    });

    if (coords) {
      emit({
        type,
        coordinates: coords,
        nativeEvent: event,
      });
    }
  };

  return (
    <div
      ref={observerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        // We want this to be on top of everything to capture events
        zIndex: 5,
        // But we might want to let clicks pass through to interactive elements if needed?
        // For now, let's capture.
        touchAction: "none", // Prevent scrolling on mobile while interacting
      }}
      onPointerDown={(e) => handlePointerEvent(e, "CHART_POINTER_DOWN")}
      onPointerLeave={(e) => handlePointerEvent(e, "CHART_POINTER_LEAVE")}
      onPointerMove={(e) => handlePointerEvent(e, "CHART_POINTER_MOVE")}
      onPointerUp={(e) => handlePointerEvent(e, "CHART_POINTER_UP")}
    />
  );
}
