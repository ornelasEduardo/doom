/**
 * useEngine Hook
 *
 * React hook that manages the Engine lifecycle, connecting the
 * pure Engine to React's component tree.
 *
 * Responsibilities:
 * - Create and dispose Engine instance
 * - Sync data to spatial index
 * - Handle container attachment and resize
 * - Wire up event handler with stable callback pattern
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { Engine, EngineEvent, IndexedPoint } from "../engine";

// =============================================================================
// TYPES
// =============================================================================

export interface UseEngineOptions<T = unknown> {
  /** Data points to index for spatial queries */
  data?: T[];

  /** Function to get X coordinate from data item */
  getX?: (d: T) => number;

  /** Function to get Y coordinate from data item */
  getY?: (d: T) => number;

  /** Function to get series ID from data item */
  getSeriesId?: (d: T) => string;

  /** Function to get data index from data item */
  getDataIndex?: (d: T, index: number) => number;

  /** Plot bounds for coordinate calculations */
  plotBounds?: { x: number; y: number; width: number; height: number };

  /** Event handler for engine events */
  onEvent?: (event: EngineEvent<T>) => void;

  /** Magnetic radius for snapping (pixels) */
  magneticRadius?: number;
}

export interface UseEngineResult<T = unknown> {
  /** The Engine instance */
  engine: Engine<T>;

  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLElement | null>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useEngine<T = unknown>(
  options: UseEngineOptions<T> = {},
): UseEngineResult<T> {
  const {
    data,
    getX,
    getY,
    getSeriesId,
    getDataIndex,
    plotBounds,
    onEvent,
    magneticRadius,
  } = options;

  // Container ref for DOM attachment
  const containerRef = useRef<HTMLElement | null>(null);

  // Track container element state for triggering effects
  const [containerElement, setContainerElement] = useState<HTMLElement | null>(
    null,
  );

  // =========================================================================
  // Engine Creation (Stable)
  // =========================================================================

  const engine = useMemo(
    () =>
      new Engine<T>({
        magneticRadius,
        useDomHitTesting: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // Intentionally empty - engine is created once per hook instance
  );

  // =========================================================================
  // Event Handler (Stable Callback Pattern)
  // =========================================================================

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    engine.setHandler((event: EngineEvent<T>) => {
      onEventRef.current?.(event);
    });
  }, [engine]);

  // =========================================================================
  // Plot Bounds Sync
  // =========================================================================

  useEffect(() => {
    if (!plotBounds) {
      return;
    }

    const currentRect = engine.getContainerRect();
    if (currentRect) {
      engine.updateBounds(currentRect, plotBounds);
    } else {
      engine.setContainer(null, plotBounds);
    }
  }, [engine, plotBounds]);

  // =========================================================================
  // Data Sync to Spatial Index
  // =========================================================================

  useEffect(() => {
    if (!data || !getX || !getY) {
      engine.updateData([]);
      return;
    }

    const points: IndexedPoint<T>[] = data.map((d, i) => ({
      x: getX(d),
      y: getY(d),
      data: d,
      seriesId: getSeriesId?.(d) ?? "default",
      dataIndex: getDataIndex?.(d, i) ?? i,
    }));

    engine.updateData(points);
  }, [engine, data, getX, getY, getSeriesId, getDataIndex]);

  // =========================================================================
  // Container Ref Detection
  // Refs don't trigger re-renders, so we poll on RAF to detect changes
  // =========================================================================

  useEffect(() => {
    if (containerRef.current && containerRef.current !== containerElement) {
      setContainerElement(containerRef.current);
    }

    const rafId = requestAnimationFrame(() => {
      if (containerRef.current !== containerElement) {
        setContainerElement(containerRef.current);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [containerElement]);

  // =========================================================================
  // Container Attachment & ResizeObserver
  // =========================================================================

  useEffect(() => {
    if (!containerElement) {
      return;
    }

    engine.setContainer(containerElement, plotBounds);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.target.getBoundingClientRect();
        engine.updateBounds(rect as DOMRect, plotBounds);
      }
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [engine, containerElement, plotBounds]);

  // =========================================================================
  // Cleanup on Unmount
  // =========================================================================

  useEffect(() => {
    return () => {
      engine.dispose();
    };
  }, [engine]);

  // =========================================================================
  // Return Value
  // =========================================================================

  return {
    engine,
    containerRef,
  };
}
