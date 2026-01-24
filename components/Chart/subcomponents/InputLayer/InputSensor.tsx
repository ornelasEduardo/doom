import { useEffect, useRef } from "react";

import { useEventContext } from "../../state/EventContext";
import { normalizeCoordinates } from "../../utils/coordinates";

export function InputSensor() {
  const { emit } = useEventContext();
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = observerRef.current?.closest(
      "[data-chart-container]",
    ) as HTMLElement;
    if (!container) {
      return;
    }

    const handlePointerEvent = (
      event: PointerEvent,
      type:
        | "CHART_POINTER_MOVE"
        | "CHART_POINTER_DOWN"
        | "CHART_POINTER_UP"
        | "CHART_POINTER_LEAVE",
    ) => {
      const svg = container.querySelector("[data-chart-plot]") as SVGSVGElement;
      const innerPlotGroup = svg?.querySelector(
        "[data-chart-inner-plot]",
      ) as SVGGElement;

      if (!svg) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
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

    const onPointerMove = (e: PointerEvent) =>
      handlePointerEvent(e, "CHART_POINTER_MOVE");
    const onPointerDown = (e: PointerEvent) =>
      handlePointerEvent(e, "CHART_POINTER_DOWN");
    const onPointerUp = (e: PointerEvent) =>
      handlePointerEvent(e, "CHART_POINTER_UP");
    const onPointerLeave = (e: PointerEvent) =>
      handlePointerEvent(e, "CHART_POINTER_LEAVE");

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointerleave", onPointerLeave);

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [emit]);

  return (
    <div
      ref={observerRef}
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        pointerEvents: "none",
      }}
    />
  );
}
