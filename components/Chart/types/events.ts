import { Selection } from "d3-selection";

import { ContextValue } from "./context";
import { Interaction } from "./interaction";

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

/**
 * BehaviorContext provides the execution environment for behaviors.
 */
export interface BehaviorContext<T = any> {
  getChartContext: () => ContextValue<T> & {
    g: Selection<SVGGElement, unknown, null, undefined> | null;
  };
  getInteraction: (name: string) => Interaction | null;
  upsertInteraction: (name: string, interaction: any) => void;
  removeInteraction: (name: string) => void;
}

/**
 * A Behavior is a pure function that attaches logic to a chart.
 */
export type Behavior<T = any> = (context: BehaviorContext<T>) => Cleanup | void;

/**
 * SensorContext provides the event backbone for sensors.
 */
export interface SensorContext<T = unknown> {
  on: (type: EventType, listener: EventListener) => void;
  off: (type: EventType, listener: EventListener) => void;
  getChartContext: () => ContextValue<T>;
  getInteraction: (name: string) => Interaction | null;
  upsertInteraction: (name: string, interaction: Interaction) => void;
  removeInteraction: (name: string) => void;
  emit: (event: ChartEvent) => void;
  pointerPosition: Coordinates | null;
  isWithinPlot: boolean;
}

/**
 * A Sensor is a function that detects user intent and updates the interaction store.
 */
export type Sensor<T = unknown> = (context: SensorContext<T>) => Cleanup | void;

export interface EventContextValue {
  on: (type: EventType, listener: EventListener) => void;
  off: (type: EventType, listener: EventListener) => void;
  emit: (event: ChartEvent) => void;
  pointerPosition: Coordinates | null;
  isWithinPlot: boolean;
}
