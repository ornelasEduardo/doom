import React, { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { EngineCancellation, InputAction, InputSignal } from "../../engine";

/**
 * InteractionLayer
 *
 * The root-level driver that captures native DOM pointer events on the Chart Container
 * and forwards them to the Engine as InputSignals.
 *
 * Features:
 * - Immediate normalization; the Engine owns move coalescing
 * - Direct Engine integration (no EventContext)
 * - Keyboard Support
 */
export const InteractionLayer: React.FC = () => {
  const { chartStore, engine } = useChartContext();
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = observerRef.current?.closest(
      "[data-chart-container]",
    ) as HTMLElement;
    if (!container || !engine) {
      return;
    }
    const captured = new Map<number, Pick<InputSignal, "source" | "userId">>();
    const releaseCaptured = (event: EngineCancellation) => {
      for (const [id, owner] of [...captured]) {
        if (
          event.scope === "stream" &&
          (event.id !== id ||
            event.source !== owner.source ||
            event.userId !== owner.userId)
        ) {
          continue;
        }
        captured.delete(id);
        if (container.hasPointerCapture(id)) {
          container.releasePointerCapture(id);
        }
      }
    };
    const unsubscribeCancellation =
      engine.subscribeCancellation(releaseCaptured);

    const dispatch = (
      event: PointerEvent | KeyboardEvent,
      signal: ReturnType<typeof engine.createSignal>,
    ) => {
      if (!signal) {
        return;
      }
      // Clear the reference itself: even a saved capability must not retain a native event.
      let native: PointerEvent | KeyboardEvent | null = event;
      signal.native = {
        capturePointer: () => {
          if (native && "pointerId" in native) {
            try {
              container.setPointerCapture(native.pointerId);
            } catch (error) {
              // Synthetic input has no active browser pointer to capture.
              if (
                error instanceof DOMException &&
                error.name === "NotFoundError"
              ) {
                return;
              }
              throw error;
            }
            captured.set(native.pointerId, {
              source: signal.source,
              userId: signal.userId,
            });
          }
        },
        releasePointer: () => {
          if (native && "pointerId" in native) {
            captured.delete(native.pointerId);
            if (container.hasPointerCapture(native.pointerId)) {
              container.releasePointerCapture(native.pointerId);
            }
          }
        },
        preventDefault: () => native?.preventDefault(),
      };
      try {
        if (engine.input(signal)) {
          event.preventDefault();
        }
      } finally {
        native = null;
        delete signal.native;
      }
    };

    const onPointerEvent = (event: PointerEvent) => {
      if (
        event.type === "pointerleave" &&
        (event.pointerType === "touch" || captured.has(event.pointerId))
      ) {
        return;
      }
      if (event.type === "lostpointercapture") {
        if (!captured.delete(event.pointerId)) {
          return;
        }
      }
      try {
        dispatch(event, engine.createSignal(event, getInputAction(event.type)));
      } finally {
        if (event.type === "pointerup" || event.type === "pointercancel") {
          captured.delete(event.pointerId);
        }
      }
    };

    const onOutsidePointerDown = (event: PointerEvent) => {
      if (
        event.pointerType !== "touch" ||
        event.composedPath().includes(container)
      ) {
        return;
      }
      const signal = engine.createSignal(event, InputAction.CANCEL);
      if (signal) {
        signal.cancelScope = "chart";
        engine.input(signal);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.target === container) {
        dispatch(event, engine.createKeySignal(event));
      }
    };

    // 4. Attach Listeners
    container.addEventListener("pointermove", onPointerEvent, {
      passive: false,
    });
    container.addEventListener("pointerdown", onPointerEvent, {
      passive: false,
    });
    container.addEventListener("pointerup", onPointerEvent);
    container.addEventListener("pointerleave", onPointerEvent);
    container.addEventListener("pointercancel", onPointerEvent);
    container.ownerDocument.addEventListener(
      "pointerdown",
      onOutsidePointerDown,
      { capture: true, passive: false },
    );
    container.addEventListener("keydown", onKey);
    container.addEventListener("keyup", onKey);
    container.addEventListener("lostpointercapture", onPointerEvent);

    return () => {
      container.removeEventListener("pointermove", onPointerEvent);
      container.removeEventListener("pointerdown", onPointerEvent);
      container.removeEventListener("pointerup", onPointerEvent);
      container.removeEventListener("pointerleave", onPointerEvent);
      container.removeEventListener("pointercancel", onPointerEvent);
      container.ownerDocument.removeEventListener(
        "pointerdown",
        onOutsidePointerDown,
        true,
      );
      container.removeEventListener("keydown", onKey);
      container.removeEventListener("keyup", onKey);
      container.removeEventListener("lostpointercapture", onPointerEvent);
      unsubscribeCancellation();
      releaseCaptured({ scope: "chart" });
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
    case "lostpointercapture":
    case "pointercancel":
    case "pointerleave":
      return InputAction.CANCEL;
    default:
      return InputAction.MOVE;
  }
}
