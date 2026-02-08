/**
 * Scheduler
 *
 * Manages the execution timing of engine tasks.
 * Critical tasks (pointer down) run synchronously.
 * Visual tasks (hover) are batched to requestAnimationFrame.
 */

import { EngineEvent, ScheduledTask, TaskPriority } from "./types";

export type TaskHandler<T = unknown> = (event: EngineEvent<T>) => void;

/**
 * The Scheduler controls when events are dispatched to sensors.
 * It uses a priority-based system to ensure critical interactions
 * (like drag start) happen immediately, while visual updates
 * (like hover highlights) are batched for performance.
 */
export class Scheduler<T = unknown> {
  private visualQueue: ScheduledTask<T>[] = [];
  private idleQueue: ScheduledTask<T>[] = [];
  private rafId: number | null = null;
  private handler: TaskHandler<T> | null = null;

  /**
   * Register the handler that will process events.
   * In the full system, this is the EventBus.dispatch method.
   */
  setHandler(handler: TaskHandler<T>): void {
    this.handler = handler;
  }

  /**
   * Schedule a task for execution.
   *
   * @param priority - The priority level of the task
   * @param event - The engine event to dispatch
   */
  schedule(priority: TaskPriority, event: EngineEvent<T>): void {
    const task: ScheduledTask<T> = {
      priority,
      event,
      timestamp: performance.now(),
    };

    switch (priority) {
      case TaskPriority.CRITICAL:
        // Critical tasks execute immediately (synchronously)
        this.executeCritical(task);
        break;

      case TaskPriority.VISUAL:
        // Visual tasks are batched to the next animation frame
        this.visualQueue.push(task);
        this.scheduleVisualFlush();
        break;

      case TaskPriority.IDLE:
        // Idle tasks are deferred even further
        this.idleQueue.push(task);
        this.scheduleIdleFlush();
        break;
    }
  }

  /**
   * Execute a critical task immediately.
   * This is synchronous to allow preventDefault() on the original event.
   */
  private executeCritical(task: ScheduledTask<T>): void {
    if (this.handler) {
      this.handler(task.event);
    }
  }

  /**
   * Schedule a flush of the visual queue on the next animation frame.
   */
  private scheduleVisualFlush(): void {
    if (this.rafId !== null) {
      return;
    } // Already scheduled

    this.rafId = requestAnimationFrame(() => {
      this.flushVisualQueue();
      this.rafId = null;
    });
  }

  /**
   * Process all queued visual tasks.
   * Only the most recent event per input ID is processed (coalescing).
   */
  private flushVisualQueue(): void {
    if (!this.handler || this.visualQueue.length === 0) {
      return;
    }

    // Coalesce: Group by input ID, keep only the latest
    const latestByInputId = new Map<number, ScheduledTask<T>>();
    for (const task of this.visualQueue) {
      const existing = latestByInputId.get(task.event.signal.id);
      if (!existing || task.timestamp > existing.timestamp) {
        latestByInputId.set(task.event.signal.id, task);
      }
    }

    // Clear the queue
    this.visualQueue = [];

    // Dispatch coalesced events
    for (const task of Array.from(latestByInputId.values())) {
      this.handler(task.event);
    }
  }

  /**
   * Schedule a flush of the idle queue using requestIdleCallback.
   */
  private scheduleIdleFlush(): void {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => this.flushIdleQueue());
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.flushIdleQueue(), 50);
    }
  }

  /**
   * Process all queued idle tasks.
   */
  private flushIdleQueue(): void {
    if (!this.handler || this.idleQueue.length === 0) {
      return;
    }

    const tasks = this.idleQueue;
    this.idleQueue = [];

    for (const task of tasks) {
      this.handler(task.event);
    }
  }

  /**
   * Cancel all pending tasks and clean up.
   */
  dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.visualQueue = [];
    this.idleQueue = [];
    this.handler = null;
  }
}
