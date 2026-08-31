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

import { useEffect, useMemo, useRef } from "react";

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

  const hasOnEvent = Boolean(onEvent);

  useEffect(() => {
    // The Engine has one handler slot, and in the Chart it belongs to
    // SensorManager. Claiming it here when the caller never asked to observe
    // events would silently overwrite the real handler — whichever effect runs
    // last wins, which is exactly the kind of ordering that changes between a
    // fresh mount and an <Activity>/Offscreen re-show.
    if (!hasOnEvent) {
      return;
    }

    engine.setHandler((event: EngineEvent<T>) => {
      onEventRef.current?.(event);
    });
  }, [engine, hasOnEvent]);

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
      engine.setContainer(null, null, plotBounds);
    }
  }, [engine, plotBounds]);

  // =========================================================================
  // Data Sync to Spatial Index
  // =========================================================================

  useEffect(() => {
    // Only manage the index when this hook was actually given data to index.
    // Clearing otherwise discards whatever another owner put there — in the
    // Chart that is Root, which builds points from the registered series.
    if (!data) {
      return;
    }

    if (!getX || !getY) {
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
  // Cleanup on Unmount
  // =========================================================================

  useEffect(() => {
    // StrictMode (and Suspense/Activity hides) run this effect's cleanup and
    // then re-run it against the same memoized engine — re-arm it so input
    // isn't permanently swallowed after the simulated unmount.
    engine.activate();

    return () => {
      engine.dispose();
    };
  }, [engine]);

  // =========================================================================
  // Return Value
  // =========================================================================

  return {
    engine,
  };
}
