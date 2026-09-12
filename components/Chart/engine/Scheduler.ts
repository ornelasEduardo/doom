import {
  EngineEvent,
  InputAction,
  InputSignal,
  ScheduledTask,
  TaskPriority,
} from "./types";

export type TaskHandler<T = unknown> = (event: EngineEvent<T>) => void;

/** Critical input is synchronous; visual input is sampled once per stream per frame. */
export class Scheduler<T = unknown> {
  private visualQueue = new Map<string, ScheduledTask<T>>();
  private activeVisualQueue = new Map<string, ScheduledTask<T>>();
  private closingStreams = new Map<string, ScheduledTask<T>>();
  private idleQueue: ScheduledTask<T>[] = [];
  private activeIdleQueue: ScheduledTask<T>[] = [];
  private rafId: number | null = null;
  private handler: TaskHandler<T> | null = null;

  setHandler(handler: TaskHandler<T>): void {
    this.handler = handler;
  }

  schedule(priority: TaskPriority, event: EngineEvent<T>): void {
    const key = this.streamKey(event.signal);
    if (
      event.signal.action === InputAction.CANCEL ||
      event.signal.action === InputAction.START
    ) {
      this.cancelStream(event.signal);
    }

    const task: ScheduledTask<T> = {
      priority,
      event,
      timestamp: performance.now(),
    };

    switch (priority) {
      case TaskPriority.CRITICAL:
        if (event.signal.action === InputAction.END) {
          const pending =
            this.visualQueue.get(key) ?? this.activeVisualQueue.get(key);
          this.visualQueue.delete(key);
          this.activeVisualQueue.delete(key);
          this.closingStreams.set(key, task);
          // Finish the last sampled movement before a sensor ends its gesture.
          try {
            if (pending) {
              this.executeCritical(pending);
            }
          } finally {
            // Cancellation or disposal during MOVE invalidates the closing END.
            if (this.closingStreams.get(key) === task) {
              this.closingStreams.delete(key);
              this.visualQueue.delete(key);
              this.activeVisualQueue.delete(key);
              this.executeCritical(task);
            }
          }
        } else {
          this.executeCritical(task);
        }
        break;

      case TaskPriority.VISUAL:
        this.visualQueue.set(key, task);
        this.scheduleVisualFlush();
        break;

      case TaskPriority.IDLE:
        this.idleQueue.push(task);
        this.scheduleIdleFlush();
        break;
    }
  }

  private executeCritical(task: ScheduledTask<T>): void {
    if (this.handler) {
      this.handler(task.event);
    }
  }

  private scheduleVisualFlush(): void {
    if (this.rafId !== null) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      // Release the frame before callbacks so reentrant input can request another.
      this.rafId = null;
      this.flushVisualQueue();
    });
  }

  /**
   * Tuple encoding prevents user/source delimiters from aliasing another stream.
   */
  private streamKey(signal: InputSignal): string {
    return JSON.stringify([signal.userId, signal.source, signal.id]);
  }

  cancelStream(signal: InputSignal): void {
    const key = this.streamKey(signal);
    this.closingStreams.delete(key);
    this.visualQueue.delete(key);
    this.activeVisualQueue.delete(key);
  }

  private flushVisualQueue(): void {
    this.activeVisualQueue = this.visualQueue;
    this.visualQueue = new Map();
    const errors: unknown[] = [];
    // Keep the batch addressable: a callback may cancel or end another stream.
    for (const [key, task] of this.activeVisualQueue) {
      this.activeVisualQueue.delete(key);
      try {
        this.executeCritical(task);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) {
      throw errors[0];
    }
  }

  private scheduleIdleFlush(): void {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => this.flushIdleQueue());
    } else {
      setTimeout(() => this.flushIdleQueue(), 50);
    }
  }

  private flushIdleQueue(): void {
    if (!this.handler || this.idleQueue.length === 0) {
      return;
    }

    this.activeIdleQueue = this.idleQueue;
    this.idleQueue = [];
    const errors: unknown[] = [];
    for (const task of this.activeIdleQueue) {
      try {
        this.executeCritical(task);
      } catch (error) {
        errors.push(error);
      }
    }
    this.activeIdleQueue = [];
    if (errors.length) {
      throw errors[0];
    }
  }

  /**
   * Discard queued tasks while keeping the scheduler ready for new input.
   */
  cancelPending(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.visualQueue.clear();
    this.activeVisualQueue.clear();
    this.closingStreams.clear();
    this.idleQueue = [];
    this.activeIdleQueue.length = 0;
  }

  dispose(): void {
    this.cancelPending();
  }
}
