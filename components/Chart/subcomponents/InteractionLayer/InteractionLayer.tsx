import React, { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { InputAction } from "../../engine";

/**
 * InteractionLayer
 *
 * The root-level driver that captures native DOM pointer events on the Chart Container
 * and forwards them to the Engine as InputSignals.
 *
 * Features:
 * - RAF Throttling (60fps aligned for moves)
 * - Direct Engine integration (no EventContext)
 * - Keyboard Support
 */
export const InteractionLayer: React.FC = () => {
  const { chartStore, engine } = useChartContext();
  const observerRef = useRef<HTMLDivElement>(null);

  // RAF State
  const frameRef = useRef<number | null>(null);
  const lastEventRef = useRef<PointerEvent | null>(null);

  useEffect(() => {
    // 1. Locate the container (parent of this invisible element)
    const container = observerRef.current?.closest(
      "[data-chart-container]",
    ) as HTMLElement;

    if (!container || !engine) {
      return;
    }

    // 2. Define the throttled processor
    const processEvent = () => {
      const event = lastEventRef.current;
      if (!event) {
        return;
      }

      // Map native event to InputAction
      const action = getInputAction(event.type);

      // Create signal and send to engine
      const signal = engine.createSignal(event, action);
      if (signal) {
        engine.input(signal);
      }

      // Reset
      lastEventRef.current = null;
      frameRef.current = null;
    };

    // 3. Define the listener (Throttler)
    const onPointerEvent = (e: PointerEvent) => {
      // CRITICAL: Do NOT throttle state-change events (down, up, leave).
      // These need immediate processing for proper drag/click handling.
      if (
        e.type === "pointerdown" ||
        e.type === "pointerup" ||
        e.type === "pointerleave"
      ) {
        // Cancel any pending frame to avoid processing stale events
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }

        // Force synchronous processing
        lastEventRef.current = e;
        processEvent();
        return;
      }

      // Throttle moves to RAF
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
        // Create and send keyboard signal
        const signal = engine.createKeySignal(e);
        engine.input(signal);
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
  }, [engine, chartStore]);

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

// Helper: Map pointer event type to InputAction
function getInputAction(nativeType: string): InputAction {
  switch (nativeType) {
    case "pointerdown":
      return InputAction.START;
    case "pointerup":
      return InputAction.END;
    case "pointerleave":
      return InputAction.CANCEL;
    default:
      return InputAction.MOVE;
  }
}
