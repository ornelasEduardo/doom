/**
 * Engine
 *
 * The central brain of the Chart interaction system.
 * Receives InputSignals, queries the SpatialIndex, and dispatches to the Scheduler.
 */

import { Scheduler, TaskHandler } from "./Scheduler";
import {
  IndexedPoint,
  SpatialIndex,
  SpatialIndexOptions,
} from "./SpatialIndex";
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

export interface EngineOptions extends SpatialIndexOptions {
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
 * 3. Query the SpatialIndex to find candidates
 * 4. Schedule events based on priority
 * 5. Dispatch to sensors via the configured handler
 */
export class Engine<T = unknown> {
  private spatialIndex: SpatialIndex<T>;
  private scheduler: Scheduler<T>;
  private containerRect: DOMRect | null = null;
  private plotBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private disposed = false;

  constructor(options: EngineOptions = {}) {
    this.spatialIndex = new SpatialIndex<T>(options);
    this.scheduler = new Scheduler<T>();

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
    plotBounds?: { x: number; y: number; width: number; height: number },
  ): void {
    if (element) {
      this.containerRect = element.getBoundingClientRect();
      this.spatialIndex.setContainer(element);
    } else {
      this.containerRect = null;
      this.spatialIndex.setContainer(null);
    }

    if (plotBounds) {
      this.plotBounds = plotBounds;
    }
  }

  /**
   * Update the container bounds without changing the element reference.
   * Useful for resize handling.
   */
  updateBounds(
    rect: DOMRect,
    plotBounds?: { x: number; y: number; width: number; height: number },
  ): void {
    this.containerRect = rect;
    if (plotBounds) {
      this.plotBounds = plotBounds;
    }
  }

  /**
   * Update the spatial index with new data points.
   */
  updateData(points: IndexedPoint<T>[]): void {
    this.spatialIndex.updateIndex(points);
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
    this.spatialIndex.clear();
    this.containerRect = null;
    this.plotBounds = null;
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

    // Query the spatial index
    const candidates = this.spatialIndex.find(signal.x, signal.y);

    // Calculate chart-relative coordinates (within plot area)
    const { chartX, chartY, isWithinPlot } = this.calculateChartCoordinates(
      signal.x,
      signal.y,
    );

    // Build the engine event
    const event: EngineEvent<T> = {
      signal,
      candidates,
      primaryCandidate: candidates[0],
      chartX,
      chartY,
      isWithinPlot,
    };

    // Determine priority and schedule
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
    if (!this.containerRect) {
      return null;
    }

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

    // Convert to container-relative coordinates
    const x = clientX - this.containerRect.left;
    const y = clientY - this.containerRect.top;

    // Determine source
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
      x,
      y,
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
   * Calculate coordinates relative to the plot area.
   */
  private calculateChartCoordinates(
    containerX: number,
    containerY: number,
  ): {
    chartX: number;
    chartY: number;
    isWithinPlot: boolean;
  } {
    if (!this.plotBounds) {
      return { chartX: containerX, chartY: containerY, isWithinPlot: true };
    }

    const chartX = containerX - this.plotBounds.x;
    const chartY = containerY - this.plotBounds.y;

    const isWithinPlot =
      chartX >= 0 &&
      chartX <= this.plotBounds.width &&
      chartY >= 0 &&
      chartY <= this.plotBounds.height;

    return { chartX, chartY, isWithinPlot };
  }

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
    return this.containerRect;
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
    return this.plotBounds;
  }

  /**
   * Check if the engine has been disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}
