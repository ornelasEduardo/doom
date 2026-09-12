import type { InteractionTarget } from "../types/interaction";
import { CoordinateSystem } from "./CoordinateSystem";
import { Scheduler, TaskHandler } from "./Scheduler";
import {
  GeometryRegistration,
  IndexedPoint,
  SpatialMap,
  SpatialMapOptions,
} from "./SpatialMap";
import {
  EngineCancellation,
  EngineEvent,
  InputAction,
  InputSignal,
  InputSource,
  type InteractionCandidate,
  TaskPriority,
} from "./types";

export interface EngineOptions extends SpatialMapOptions {
  onEvent?: TaskHandler;
}

/** Schedules input, resolves surviving samples, and dispatches to sensors. */
export class Engine<T = unknown> {
  private spatialMap: SpatialMap<T>;
  private scheduler: Scheduler<T>;
  private coords: CoordinateSystem;
  private disposed = false;
  private geometrySubscribers = new Set<() => void>();
  private cancellationSubscribers = new Set<
    (event: EngineCancellation) => void
  >();
  private handler: TaskHandler<T> | null = null;
  private cancellations = new Set<EngineCancellation>();

  constructor(options: EngineOptions = {}) {
    this.spatialMap = new SpatialMap<T>(options);
    this.scheduler = new Scheduler<T>();
    this.coords = new CoordinateSystem();

    this.handler = options.onEvent ?? null;
    this.scheduler.setHandler((event) => {
      this.resolveEvent(event);
      this.handler?.(event);
    });
  }

  setContainer(
    element: Element | null,
    plotElement: Element | null = null,
    plotBounds?: { x: number; y: number; width: number; height: number },
  ): void {
    this.spatialMap.setContainer(element, plotElement);
    this.coords.setContainer(element, plotElement, plotBounds);
  }

  updateBounds(
    rect: DOMRect,
    plotBounds?: { x: number; y: number; width: number; height: number },
  ): void {
    this.coords.updateBounds(rect, plotBounds);
  }

  updateData(points: IndexedPoint<T>[]): void {
    this.spatialMap.updateIndex(points);
  }

  /** Register extension-owned hit geometry without replacing built-in series. */
  registerGeometry(points: IndexedPoint<T>[] = []): GeometryRegistration<T> {
    const registration = this.spatialMap.registerGeometry(points);
    let active = true;
    const notify = () => {
      this.geometrySubscribers.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          console.error("Chart geometry listener failed", error);
        }
      });
    };
    notify();
    return {
      update: (next) => {
        if (!active) {
          return;
        }
        registration.update(next);
        notify();
      },
      dispose: () => {
        if (!active) {
          return;
        }
        active = false;
        registration.dispose();
        notify();
      },
    };
  }

  subscribeGeometryChanges(listener: () => void): () => void {
    this.geometrySubscribers.add(listener);
    return () => {
      this.geometrySubscribers.delete(listener);
    };
  }

  resolveTarget(
    target: Pick<
      InteractionTarget<T>,
      "seriesId" | "dataIndex" | "geometryOwner"
    >,
  ): InteractionTarget<T> | null | undefined {
    if (target.seriesId === undefined || target.dataIndex === undefined) {
      return null;
    }
    const resolved = this.spatialMap.resolveTarget(
      target.seriesId,
      target.dataIndex,
      target.geometryOwner,
    );
    if (resolved === undefined) {
      return undefined;
    }
    return resolved?.data !== undefined
      ? { ...resolved, data: resolved.data }
      : null;
  }

  /** Resolve a vertical slice after a sensor chooses its own primary candidate. */
  resolveSlice(candidate: InteractionCandidate<T>): InteractionCandidate<T>[] {
    return this.spatialMap.findSlice(candidate);
  }

  setHandler(handler: TaskHandler<T>): void {
    this.handler = handler;
  }

  subscribeCancellation(
    listener: (event: EngineCancellation) => void,
  ): () => void {
    this.cancellationSubscribers.add(listener);
    return () => {
      this.cancellationSubscribers.delete(listener);
    };
  }

  private notifyCancellation(event: EngineCancellation): void {
    for (const listener of [...this.cancellationSubscribers]) {
      try {
        listener(event);
      } catch (error) {
        console.error("Cancellation subscriber error:", error);
      }
    }
  }

  /**
   * Re-arm a disposed engine so it accepts input again.
   * React StrictMode (dev) and Suspense/Activity hides tear down and re-run
   * effects against the same Engine instance, so dispose() must be reversible
   * for effect setup/cleanup symmetry.
   */
  activate(): void {
    this.disposed = false;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.notifyCancellation({ scope: "chart" });

    // Scheduled work only. The handler and index are not resources to reclaim
    // — the engine is per-instance — and clearing them would make activate()
    // unable to restore a working engine.
    this.scheduler.dispose();
  }

  /**
   * Process an InputSignal.
   * MOVE is sampled: only the latest arrival per user/source/id survives each
   * frame. END flushes that sample synchronously; CANCEL discards it. Producers
   * needing every motion sample (such as drawing) need a separate lossless path.
   *
   * @returns Whether a sensor synchronously acknowledged a KEY signal.
   */
  input(signal: InputSignal): boolean {
    if (this.disposed) {
      return false;
    }
    if (this.cancellations.size) {
      for (const event of this.cancellations) {
        if (
          event.scope === "chart" ||
          (!(
            signal.action === InputAction.CANCEL &&
            signal.cancelScope === "chart"
          ) &&
            event.id === signal.id &&
            event.source === signal.source &&
            event.userId === signal.userId)
        ) {
          return false;
        }
      }
    }

    if (signal.action === InputAction.CANCEL) {
      const cancellation: EngineCancellation =
        signal.cancelScope === "chart"
          ? { scope: "chart" }
          : {
              scope: "stream",
              userId: signal.userId,
              source: signal.source,
              id: signal.id,
            };
      // Invalidate before callbacks, and keep this scope closed through dispatch.
      this.cancellations.add(cancellation);
      try {
        if (cancellation.scope === "chart") {
          this.scheduler.cancelPending();
        } else {
          this.scheduler.cancelStream(signal);
        }
        this.notifyCancellation(cancellation);
        return this.disposed ? false : this.scheduleInput(signal);
      } finally {
        this.cancellations.delete(cancellation);
      }
    }

    return this.scheduleInput(signal);
  }

  private scheduleInput(signal: InputSignal): boolean {
    // Only surviving samples pay for spatial resolution. The same event object
    // is hydrated synchronously for critical input, preserving KEY acknowledgement.
    const event: EngineEvent<T> = {
      signal,
      candidates: [],
      sliceCandidates: [],
      chartX: 0,
      chartY: 0,
      isWithinPlot: false,
    };
    this.scheduler.schedule(this.determinePriority(signal.action), event);
    return signal.action === InputAction.KEY && event.handled === true;
  }

  private resolveEvent(event: EngineEvent<T>): void {
    const { signal } = event;
    const plotOffset = this.coords.getPlotOffset();
    const searchX = signal.x - plotOffset.x;
    const searchY = signal.y - plotOffset.y;

    // Key signals carry no position — createKeySignal reports (0, 0) — so a
    // hit test there would return whatever sits near the plot origin.
    // KeyboardSensor resolves its own target from the focused index.
    const candidates =
      signal.action === InputAction.KEY
        ? []
        : this.spatialMap.find(searchX, searchY, {
            x: signal.x,
            y: signal.y,
          });

    const { chartX, chartY, isWithinPlot } =
      this.coords.resolveChartCoordinates(searchX, searchY);

    const primaryCandidate = candidates[0];
    const sliceCandidates = primaryCandidate
      ? this.spatialMap.findSlice(primaryCandidate)
      : [];

    Object.assign(event, {
      candidates,
      primaryCandidate,
      sliceCandidates,
      chartX,
      chartY,
      isWithinPlot,
    });
  }

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
        event.pointerType === "touch"
          ? InputSource.TOUCH
          : event.pointerType === "pen"
            ? InputSource.PEN
            : InputSource.MOUSE;
    } else if ("touches" in event) {
      source = InputSource.TOUCH;
    }

    return {
      id: "pointerId" in event ? event.pointerId : 0,
      pointerType: "pointerType" in event ? event.pointerType : undefined,
      button: "button" in event ? event.button : undefined,
      buttons: "buttons" in event ? event.buttons : undefined,
      pressure: "pressure" in event ? event.pressure : undefined,
      isPrimary: "isPrimary" in event ? event.isPrimary : undefined,
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
      keyPhase: event.type === "keyup" ? "up" : "down",
      code: event.code,
      repeat: event.repeat,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        meta: event.metaKey,
      },
    };
  }

  private determinePriority(action: InputAction): TaskPriority {
    switch (action) {
      case InputAction.START:
      case InputAction.END:
      case InputAction.CANCEL:
      case InputAction.KEY:
        return TaskPriority.CRITICAL;

      case InputAction.MOVE:
        return TaskPriority.VISUAL;

      default:
        return TaskPriority.VISUAL;
    }
  }

  resolveContainerCoordinates(
    chartX: number,
    chartY: number,
  ): { x: number; y: number } {
    return this.coords.resolveContainerCoordinates(chartX, chartY);
  }

  getContainerRect(): DOMRect | null {
    return this.coords.getContainerRect();
  }

  getPlotBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
    return this.coords.getPlotBounds();
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}
