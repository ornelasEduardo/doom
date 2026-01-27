import React, { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { useEventContext } from "../../state/EventContext";
import { EventType } from "../../types/events";
import { normalizeCoordinates } from "../../utils/coordinates";

/**
 * InteractionLayer
 *
 * The root-level driver that captures native DOM pointer events on the Chart Container
 * and broadcasts normalized chart events to the EventContext.
 *
 * Features:
 * - RAF Throttling (60fps aligned)
 * - Coordinate Normalization (fixes margins, borders, padding)
 * - Keyboard Support (basic)
 */
export const InteractionLayer: React.FC = () => {
  const { emit } = useEventContext();
  const { chartStore } = useChartContext();
  const observerRef = useRef<HTMLDivElement>(null);

  // RAF State
  const frameRef = useRef<number | null>(null);
  const lastEventRef = useRef<PointerEvent | null>(null);

  // Cache
  const plotRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // 1. Locate the container (parent of this invisible element)
    const container = observerRef.current?.closest(
      "[data-chart-container]",
    ) as HTMLElement;

    if (!container) {
      return;
    }

    // 2. Define the throttled processor
    const processEvent = () => {
      const event = lastEventRef.current;
      if (!event) {
        return;
      }

      // Lazy-find the plot SVG to avoid querySelector thrashing
      let svg = plotRef.current;
      if (!svg || !svg.isConnected) {
        svg = container.querySelector("[data-chart-plot]") as SVGSVGElement;
        plotRef.current = svg;
      }

      if (!svg) {
        return;
      } // Not ready yet

      // Map native event to ChartEventType
      const type = getChartEventType(event.type);

      // --- CRITICAL COORDINATE CALCULATION ---
      // We rely on the Store for margins, NOT the inner plot group BBox.
      // This ensures x=0 is always the true axis line, even if data doesn't touch it.
      const state = chartStore.getState();
      const { margin, innerWidth, innerHeight } = state.dimensions;

      const svgRect = svg.getBoundingClientRect();

      const containerRect = container.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);

      // Account for container borders
      const borderLeft = parseFloat(containerStyle.borderLeftWidth) || 0;
      const borderTop = parseFloat(containerStyle.borderTopWidth) || 0;

      // Construct the Virtual Plot Rect (where the plot *logically* exists)
      const plotLeft = svgRect.left + margin.left;
      const plotTop = svgRect.top + margin.top;

      const virtualPlotRect = {
        left: plotLeft,
        top: plotTop,
        width: innerWidth,
        height: innerHeight,
        right: plotLeft + innerWidth,
        bottom: plotTop + innerHeight,
        x: plotLeft,
        y: plotTop,
        toJSON: () => {},
      } as DOMRect;

      const coords = normalizeCoordinates(
        event,
        containerRect,
        virtualPlotRect,
        {
          left: borderLeft,
          top: borderTop,
        },
      );

      if (coords) {
        emit({
          type,
          coordinates: coords,
          nativeEvent: event,
        });
      }

      // Reset
      lastEventRef.current = null;
      frameRef.current = null;
    };

    // 3. Define the listener (Throttler)
    const onPointerEvent = (e: PointerEvent) => {
      lastEventRef.current = e;
      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(processEvent);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Enter",
          " ",
        ].includes(e.key)
      ) {
        // Keyboard events are not throttled for responsiveness
        emit({
          type: "CHART_KEY_DOWN",
          coordinates: {
            containerX: 0,
            containerY: 0,
            chartX: 0,
            chartY: 0,
            isWithinPlot: true,
          },
          nativeEvent: e,
        });
      }
    };

    // 4. Attach Listeners
    container.addEventListener("pointermove", onPointerEvent);
    container.addEventListener("pointerdown", onPointerEvent);
    container.addEventListener("pointerup", onPointerEvent);
    container.addEventListener("pointerleave", onPointerEvent);
    container.addEventListener("keydown", onKeyDown);

    return () => {
      container.removeEventListener("pointermove", onPointerEvent);
      container.removeEventListener("pointerdown", onPointerEvent);
      container.removeEventListener("pointerup", onPointerEvent);
      container.removeEventListener("pointerleave", onPointerEvent);
      container.removeEventListener("keydown", onKeyDown);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [emit, chartStore]);

  return (
    <div
      ref={observerRef}
      data-testid="interaction-layer"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        pointerEvents: "none",
        visibility: "hidden",
      }}
    />
  );
};

// Helper
function getChartEventType(nativeType: string): EventType {
  switch (nativeType) {
    case "pointerdown":
      return "CHART_POINTER_DOWN";
    case "pointerup":
      return "CHART_POINTER_UP";
    case "pointerleave":
      return "CHART_POINTER_LEAVE";
    default:
      return "CHART_POINTER_MOVE";
  }
}
