import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ChartEvent,
  ChartEventListener,
  ChartEventType,
  EventContextValue,
} from "../types/events";

export const EventContext = createContext<EventContextValue | null>(null);

export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("Event components must be used within a EventsProvider");
  }
  return context;
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  // Event Bus Helpers
  const listenersRef = useRef<Map<ChartEventType, Set<ChartEventListener>>>(
    new Map(),
  );

  const on = useCallback(
    (type: ChartEventType, listener: ChartEventListener) => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }
      listenersRef.current.get(type)!.add(listener);
    },
    [],
  );

  const off = useCallback(
    (type: ChartEventType, listener: ChartEventListener) => {
      const typeListeners = listenersRef.current.get(type);
      if (typeListeners) {
        typeListeners.delete(listener);
      }
    },
    [],
  );

  const [pointerPosition, setPointerPosition] = useState<any>(null);
  const [isWithinPlot, setIsWithinPlot] = useState(false);

  const emit = useCallback((event: ChartEvent) => {
    // Update state snapshots
    if (
      event.type === "CHART_POINTER_MOVE" ||
      event.type === "CHART_POINTER_DOWN"
    ) {
      setPointerPosition(event.coordinates);
      setIsWithinPlot(event.coordinates.isWithinPlot);
    } else if (event.type === "CHART_POINTER_LEAVE") {
      setPointerPosition(null);
      setIsWithinPlot(false);
    }

    // Broadcast
    const typeListeners = listenersRef.current.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((listener) => listener(event));
    }
  }, []);

  const value = useMemo(
    () => ({
      on,
      off,
      emit,
      pointerPosition,
      isWithinPlot,
    }),
    [on, off, emit, pointerPosition, isWithinPlot],
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}
