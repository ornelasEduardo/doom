"use client";

import {
  Cursor as CursorBehavior,
  Dim,
  DraggablePuck,
  Markers,
  SelectionUpdate,
  Tooltip as TooltipBehavior,
} from "./behaviors";
import {
  DataHoverSensor,
  DragSensor,
  KeyboardSensor,
  SelectionSensor,
} from "./sensors";
import {
  Axis,
  CursorWrapper,
  Footer,
  Grid,
  Header,
  Legend,
  Plot,
  Series,
} from "./subcomponents";
import { Root } from "./subcomponents/Root/Root";
import { Props } from "./types";

export type { TooltipContent } from "./behaviors/Tooltip";
export type {
  EngineCancellation,
  EngineEvent,
  InputSignal,
  InteractionCandidate,
} from "./engine";
export { InputAction, InputSource } from "./engine";
export type { GeometryRegistration, IndexedPoint } from "./engine/SpatialMap";
export type {
  Accessor,
  AxisDomain,
  AxisOptions,
  ChartProps,
  Config,
  ContextValue,
  EventType,
  LegendConfig,
  LegendItem,
  Props,
  RenderFrame,
  SeriesProps,
  SeriesType,
} from "./types";
export type {
  Behavior,
  BehaviorContext,
  ChartEvent,
  GenericBehavior,
  GenericSensor,
  Sensor,
  SensorContext,
} from "./types/events";
export type {
  ChannelReference,
  DragInteraction,
  HoverInteraction,
  Interaction,
  InteractionAccess,
  InteractionChannelHandle,
  InteractionReader,
  InteractionTarget,
  InteractionWriter,
  SelectionInteraction,
} from "./types/interaction";
export { InteractionChannel } from "./types/interaction";
export type {
  CustomGeometry,
  CustomGeometryPoint,
} from "./utils/customGeometry";
export { createInteractionChannel } from "./utils/interactionChannels";

function ChartComposed<T>(props: Props<T>) {
  if (props.children) {
    return <Root {...props} />;
  }

  return (
    <Root {...props}>
      <Grid />
      {props.d3Config?.showAxes !== false && <Axis />}
      {!props.render && <CursorWrapper mode="line" />}
      <Series render={props.render} type={props.type} x={props.x} y={props.y} />
      {!props.render && <CursorWrapper mode="dots" />}
    </Root>
  );
}

export const Chart = Object.assign(ChartComposed, {
  Root,
  Header,
  Footer,
  Legend,
  Series,
  Grid,
  Axis,
  Cursor: CursorWrapper,
  Plot,

  /**
   * Built-in sensors and behaviors, namespaced rather than exported at the top
   * level because `Tooltip` would collide with the standalone Tooltip
   * component. `Props.sensors` and `Props.behaviors` replace the defaults, so
   * these are what you compose a partial override from.
   */
  sensors: {
    DataHoverSensor,
    KeyboardSensor,
    DragSensor,
    SelectionSensor,
  },
  behaviors: {
    Tooltip: TooltipBehavior,
    Cursor: CursorBehavior,
    Markers,
    Dim,
    DraggablePuck,
    SelectionUpdate,
  },
});
