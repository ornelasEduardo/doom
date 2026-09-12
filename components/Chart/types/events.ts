import { Selection } from "d3-selection";

import { EngineEvent } from "../engine";
import { ContextValue } from "./context";
import { InteractionAccess } from "./interaction";

/**
 * Spatial coordinates normalized to the chart container and plot area.
 */
export interface Coordinates {
  containerX: number;
  containerY: number;
  chartX: number;
  chartY: number;
  isWithinPlot: boolean;
}

/**
 * Standard pointer and keyboard events supported by the Chart system.
 */
export type EventType =
  | "CHART_POINTER_MOVE"
  | "CHART_POINTER_DOWN"
  | "CHART_POINTER_UP"
  | "CHART_POINTER_LEAVE"
  | "CHART_KEY_DOWN"
  | "CHART_KEY_UP"
  | "CHART_CLICK"
  | "CHART_DOUBLE_CLICK";

/**
 * Represents a normalized event within the Doom Chart system.
 * Wraps native browser events with chart-specific spatial coordinates.
 *
 */
export interface ChartEvent {
  type: EventType;
  nativeEvent: React.SyntheticEvent | UIEvent | KeyboardEvent | TouchEvent;
  coordinates: Coordinates;
}

export type EventListener = (event: ChartEvent) => void;

export type Cleanup = () => void;

export interface BehaviorContext<T = unknown> extends InteractionAccess<T> {
  getChartContext: () => ContextValue<T> & {
    g: Selection<SVGGElement, unknown, null, undefined> | null;
  };
}

export type GenericBehavior = <T>(
  context: BehaviorContext<T>,
) => Cleanup | void;

export type Behavior<T = unknown> = (
  context: BehaviorContext<T>,
) => Cleanup | void;

export interface SensorContext<T = unknown> extends InteractionAccess<T> {
  getChartContext: () => ContextValue<T>;
}

/**
 * A Sensor is a function that detects user intent and updates the interaction store.
 * The engine invokes sensors after scheduling and spatial resolution.
 */
export type Sensor<T = unknown> = (
  event: EngineEvent<T>,
  context: SensorContext<T>,
) => void;

export type GenericSensor = <T>(...args: Parameters<Sensor<T>>) => void;
