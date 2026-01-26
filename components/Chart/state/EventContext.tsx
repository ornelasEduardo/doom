import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChartEvent, EventContextValue } from "../types/events";

type EventListener = (event: ChartEvent) => void;

/**
 * EventContext facilitates normalized event distribution across complex chart subcomponents.
 * It coordinates interaction sensors with the state management layer.
 */
export const EventContext = createContext<EventContextValue | null>(null);

/**
 * Hook to access the internal Chart Event system.
 */
export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("Event components must be used within a EventsProvider");
  }
  return context;
}

/**
 * The EventsProvider manages the registry of listeners for normalized chart events.
 * It is responsible for event emission and maintaining pointer state synchronization.
 */
export function EventsProvider({ children }: { children: React.ReactNode }) {
  const listenersRef = useRef<Map<EventType, Set<EventListener>>>(new Map());

  const on = useCallback((type: EventType, listener: EventListener) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(listener);
  }, []);

  const off = useCallback((type: EventType, listener: EventListener) => {
    const typeListeners = listenersRef.current.get(type);
    if (typeListeners) {
      typeListeners.delete(listener);
    }
  }, []);

  const [pointerPosition, setPointerPosition] = useState<Coordinates | null>(
    null,
  );
  const [isWithinPlot, setIsWithinPlot] = useState(false);

  /**
   * Broadcasts a normalized ChartEvent to all registered listeners.
   */
  const emit = useCallback((event: ChartEvent) => {
    // Synchronize global pointer state for specialized layout calculations
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
