/**
 * Engine Module
 *
 * Public API for the Chart interaction engine.
 */

export type { EngineOptions } from "./Engine";
export { Engine } from "./Engine";
export type { TaskHandler } from "./Scheduler";
export { Scheduler } from "./Scheduler";
export type { IndexedPoint, SpatialMapOptions } from "./SpatialMap";
export { CHART_DATA_ATTRS, SpatialMap } from "./SpatialMap";
export type {
  CandidateType,
  EngineEvent,
  InputSignal,
  InteractionCandidate,
  ScheduledTask,
  TaskPriority,
} from "./types";
export {
  InputAction,
  InputSource,
  TaskPriority as TaskPriorityEnum,
} from "./types";
