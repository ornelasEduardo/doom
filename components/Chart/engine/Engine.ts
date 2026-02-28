/**
 * Engine
 *
 * The central brain of the Chart interaction system.
 * Receives InputSignals, queries the SpatialIndex, and dispatches to the Scheduler.
 */

import { CoordinateSystem } from "./CoordinateSystem";
import { Scheduler, TaskHandler } from "./Scheduler";
import { IndexedPoint, SpatialMap, SpatialMapOptions } from "./SpatialMap";
import {
  EngineEvent,
  InputAction,
  InputSignal,
  InputSource,
  TaskPriority,
} from "./types";

// =============================================================================
// ENGINE OPTIONS
// =============================================================================

export interface EngineOptions extends SpatialMapOptions {
  /**
   * Called when an engine event is ready for dispatch.
   * In the full system, this connects to the EventBus.
   */
  onEvent?: TaskHandler;
}

// =============================================================================
// ENGINE CLASS
// =============================================================================

/**
 * The Engine is the core of the Hyper-Engine architecture.
 *
 * Responsibilities:
 * 1. Receive InputSignals from the InteractionLayer (or remote sources)
 * 2. Normalize coordinates (client -> container)
 * 3. Query the SpatialMap to find candidates
 * 4. Schedule events based on priority
 * 5. Dispatch to sensors via the configured handler
 */
export class Engine<T = unknown> {
  private spatialMap: SpatialMap<T>;
  private scheduler: Scheduler<T>;
  private coords: CoordinateSystem;
  private disposed = false;

  constructor(options: EngineOptions = {}) {
    this.spatialMap = new SpatialMap<T>(options);
    this.scheduler = new Scheduler<T>();
    this.coords = new CoordinateSystem();

    if (options.onEvent) {
      this.scheduler.setHandler(options.onEvent);
    }
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Set the container element and its bounds.
   * Call this on mount and when the container resizes.
   */
  setContainer(
    element: Element | null,
    plotElement: Element | null = null,
    plotBounds?: { x: number; y: number; width: number; height: number },
  ): void {
    if (element) {
      this.spatialMap.setContainer(element);
    } else {
      this.spatialMap.setContainer(null);
    }
    this.coords.setContainer(element, plotElement, plotBounds);
  }

  /**
   * Update the container bounds without changing the element reference.
   * Useful for resize handling.
   */
  updateBounds(
    rect: DOMRect,
    plotBounds?: { x: number; y: number; width: number; height: number },
  ): void {
    this.coords.updateBounds(rect, plotBounds);
  }

  /**
   * Update the spatial index with new data points.
   */
  updateData(points: IndexedPoint<T>[]): void {
    this.spatialMap.updateIndex(points);
  }

  /**
   * Set the event handler.
   */
  setHandler(handler: TaskHandler<T>): void {
    this.scheduler.setHandler(handler);
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    this.scheduler.dispose();
    this.spatialMap.clear();
  }

  // ===========================================================================
  // INPUT PROCESSING
  // ===========================================================================

  /**
   * Process an InputSignal.
   * This is the main entry point for all user interactions.
   *
   * @param signal - The normalized input signal
   */
  input(signal: InputSignal): void {
    if (this.disposed) {
      return;
    }

    const plotOffset = this.coords.getPlotOffset();
    const searchX = signal.x - plotOffset.x;
    const searchY = signal.y - plotOffset.y;

    const candidates = this.spatialMap.find(searchX, searchY, {
      x: signal.x,
      y: signal.y,
    });

    const { chartX, chartY, isWithinPlot } =
      this.coords.resolveChartCoordinates(searchX, searchY);

    const primaryCandidate = candidates[0];
    const sliceCandidates = primaryCandidate
      ? this.spatialMap.findAllAtX(primaryCandidate.coordinate.x)
      : [];

    const event: EngineEvent<T> = {
      signal,
      candidates,
      primaryCandidate,
      sliceCandidates,
      chartX,
      chartY,
      isWithinPlot,
    };

    const priority = this.determinePriority(signal.action);
    this.scheduler.schedule(priority, event);
  }

  /**
   * Create an InputSignal from a native PointerEvent.
   * Convenience method for the InteractionLayer.
   */
  createSignal(
    event: PointerEvent | MouseEvent | TouchEvent,
    action: InputAction,
    userId = "local",
  ): InputSignal | null {
    let clientX: number;
    let clientY: number;

    if ("touches" in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ("clientX" in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return null;
    }

    const resolved = this.coords.resolvePointerCoordinates(clientX, clientY);
    if (!resolved) {
      return null;
    }

    let source: InputSource = InputSource.MOUSE;
    if ("pointerType" in event) {
      source =
        event.pointerType === "touch" ? InputSource.TOUCH : InputSource.MOUSE;
    } else if ("touches" in event) {
      source = InputSource.TOUCH;
    }

    return {
      id: "pointerId" in event ? event.pointerId : 0,
      action,
      source,
      x: resolved.x,
      y: resolved.y,
      timestamp: performance.now(),
      userId,
      modifiers: {
        shift: event.shiftKey || false,
        ctrl: event.ctrlKey || false,
        alt: event.altKey || false,
        meta: event.metaKey || false,
      },
    };
  }

  /**
   * Create an InputSignal from a KeyboardEvent.
   */
  createKeySignal(event: KeyboardEvent, userId = "local"): InputSignal {
    return {
      id: 0,
      action: InputAction.KEY,
      source: InputSource.KEYBOARD,
      x: 0,
      y: 0,
      timestamp: performance.now(),
      userId,
      key: event.key,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };
  }

  // ===========================================================================
  // INTERNAL HELPERS
  // ===========================================================================

  /**
   * Determine the scheduling priority for an action.
   */
  private determinePriority(action: InputAction): TaskPriority {
    switch (action) {
      case InputAction.START:
      case InputAction.END:
      case InputAction.CANCEL:
      case InputAction.KEY:
        // These need immediate processing (for preventDefault, state changes)
        return TaskPriority.CRITICAL;

      case InputAction.MOVE:
        // Move events can be batched for performance
        return TaskPriority.VISUAL;

      default:
        return TaskPriority.VISUAL;
    }
  }

  // ===========================================================================
  // GETTERS (For Testing/Debugging)
  // ===========================================================================

  /**
   * Get the current container bounds.
   */
  getContainerRect(): DOMRect | null {
    return this.coords.getContainerRect();
  }

  /**
   * Get the current plot bounds.
   */
  getPlotBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
    return this.coords.getPlotBounds();
  }

  /**
   * Check if the engine has been disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}
