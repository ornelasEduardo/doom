import { ChartCoordinates } from "../utils/coordinates";

export type ChartEventType =
  | "CHART_POINTER_DOWN"
  | "CHART_POINTER_MOVE"
  | "CHART_POINTER_UP"
  | "CHART_POINTER_LEAVE"
  | "CHART_POINTER_ENTER";

export interface ChartEvent {
  type: ChartEventType;
  coordinates: ChartCoordinates;
  nativeEvent: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent;
}

export type ChartEventListener = (event: ChartEvent) => void;

export interface EventContextValue<T = unknown> {
  // The Event Bus
  on: (type: ChartEventType, listener: ChartEventListener) => void;
  off: (type: ChartEventType, listener: ChartEventListener) => void;
  emit: (event: ChartEvent) => void;

  // Current State (Snapshots for immediate access)
  pointerPosition: ChartCoordinates | null;
  isWithinPlot: boolean;
}

/**
 * A ChartBehavior is a function that attaches itself to the ChartContext/EventContext
 * and performs logic. It returns a cleanup function.
 */
export type ChartBehavior<T = unknown> = (
  context: EventContextValue & {
    getChartContext: () => any; // Should be ChartContextValue<T> but avoiding circular deps for now
  },
) => () => void;
