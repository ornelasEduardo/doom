import type { TooltipContent } from "../behaviors/Tooltip";

/**
 * Event type for chart interactions (native DOM events)
 */
export type ChartNativeEvent = MouseEvent | TouchEvent;

// =============================================================================
// INTERACTION STORE TYPES
// =============================================================================

/**
 * Standard Interaction Channels used as keys in the store's interactions Map.
 * This allows multiple sensors to write to different logical streams.
 */
export enum InteractionChannel {
  PRIMARY_HOVER = "primary-hover",
  SELECTION = "selection",
  CROSSHAIR = "crosshair",
  TOOLTIP_CONFIG = "tooltip-config",
  CURSOR_CONFIG = "cursor-config",
  DRAG = "drag",
}

export enum InteractionType {
  HOVER = "hover",
  SELECTION = "selection",
}

export type HoverMode = "nearest-x" | "nearest-y" | "closest" | "exact";

export interface InteractionTarget<T = unknown> {
  /** Owned geometry provenance; only the live owner may reproject this target. */
  readonly geometryOwner?: object;
  data: T;
  // The exact coordinates of this active data point (e.g. for snapping cursor)
  coordinate: { x: number; y: number };
  // Which series this point belongs to
  seriesId?: string;
  dataIndex?: number;
  seriesColor?: string;
  suppressMarker?: boolean;
}

export interface HoverInteraction<T = unknown> {
  /** Overlay placement follows the pointer unless explicitly anchored to the target. */
  anchor?: "pointer" | "target";
  // The raw pointer position relative to the chart plot area
  pointer: {
    x: number;
    y: number;
    containerX: number;
    containerY: number;
    isTouch: boolean;
  };

  /**
   * For professional crosshairs, we often want to highlight MULTIPLE points
   * at a specific X-index across all series.
   */
  targets: InteractionTarget<T>[];
  target?: InteractionTarget<T>;
}

// =============================================================================
// SELECTION STATE
// =============================================================================

export interface SelectionInteraction<T = unknown> {
  selection: T[]; // Array of selected data objects
  mode: "continuous" | "discrete"; // e.g. Brush vs Click
}

// =============================================================================
// DRAG STATE
// =============================================================================

export interface DragInteraction<T = unknown> {
  /** The data point being dragged */
  target: InteractionTarget<T>;
  /** Current pixel position during drag */
  currentPosition: { x: number; y: number };
  /** Starting pixel position when drag began */
  startPosition: { x: number; y: number };
  /** Current value in data domain (inverted from pixel) */
  currentValue: { x: any; y: any };
  /** Whether the drag is currently active */
  isDragging: boolean;
}

export type Interaction<T = unknown> =
  | HoverInteraction<T>
  | SelectionInteraction<T>
  | DragInteraction<T>;

declare const interactionPayload: unique symbol;

/** Create once and share the handle between extensions. Names are diagnostic only. */
export interface InteractionChannelHandle<Payload> {
  readonly name: string;
  readonly key: symbol;
  readonly [interactionPayload]: (payload: Payload) => Payload;
}

export type ChannelReference<Payload> =
  | string
  | InteractionChannelHandle<Payload>;

export interface BuiltinInteractionMap<T> {
  "primary-hover": HoverInteraction<T>;
  selection: SelectionInteraction<T>;
  drag: DragInteraction<T>;
  crosshair: Interaction<T>;
  "cursor-config": {
    on?: ChannelReference<HoverInteraction<T>>;
    showX?: boolean;
    showY?: boolean;
    owner?: string;
  };
  "tooltip-config": {
    owner?: string;
    on?: ChannelReference<HoverInteraction<T>>;
    render?: (content: TooltipContent<T>) => React.ReactNode;
  };
}

export type InteractionPayload<
  T,
  Name extends string,
> = Name extends keyof BuiltinInteractionMap<T>
  ? BuiltinInteractionMap<T>[Name]
  : Name extends `tooltip-config:${string}`
    ? BuiltinInteractionMap<T>["tooltip-config"]
    : Name extends `cursor-config:${string}`
      ? BuiltinInteractionMap<T>["cursor-config"]
      : Interaction<T>;

export interface InteractionReader<T = unknown> {
  getInteraction<Payload>(
    channel: InteractionChannelHandle<Payload>,
  ): Payload | null;
  getInteraction<Name extends string>(
    name: Name,
  ): InteractionPayload<T, Name> | null;
}

type ManagedHoverChannel<Channel> =
  Extract<
    Channel,
    | "selection"
    | "drag"
    | "cursor-config"
    | "tooltip-config"
    | `cursor-config:${string}`
    | `tooltip-config:${string}`
  > extends never
    ? Channel
    : never;

export interface InteractionWriter<T = unknown> extends InteractionReader<T> {
  /** Opts this channel into data/layout refresh and live custom geometry updates. */
  upsertHoverInteraction<Channel extends ChannelReference<HoverInteraction<T>>>(
    channel: Channel & NoInfer<ManagedHoverChannel<Channel>>,
    payload: HoverInteraction<T>,
  ): void;
  upsertInteraction<Payload>(
    channel: InteractionChannelHandle<Payload>,
    payload: NoInfer<Payload>,
  ): void;
  upsertInteraction<Name extends string>(
    name: Name,
    payload: InteractionPayload<T, NoInfer<Name>>,
  ): void;
  removeInteraction<Payload>(channel: InteractionChannelHandle<Payload>): void;
  removeInteraction(name: string): void;
}

export interface InteractionAccess<T = unknown> extends InteractionWriter<T> {
  /**
   * Observes latest committed state; reentrant writes may supersede intermediate values.
   * Defaults to Object.is, does not fire immediately, and reports callback errors independently.
   */
  subscribeInteraction<Payload>(
    channel: InteractionChannelHandle<Payload>,
    listener: (
      next: NoInfer<Payload> | null,
      previous: NoInfer<Payload> | null,
    ) => void,
    equality?: (
      a: NoInfer<Payload> | null,
      b: NoInfer<Payload> | null,
    ) => boolean,
  ): () => void;
  subscribeInteraction<Name extends string>(
    name: Name,
    listener: (
      next: InteractionPayload<T, NoInfer<Name>> | null,
      previous: InteractionPayload<T, NoInfer<Name>> | null,
    ) => void,
    equality?: (
      a: InteractionPayload<T, NoInfer<Name>> | null,
      b: InteractionPayload<T, NoInfer<Name>> | null,
    ) => boolean,
  ): () => void;
  /** Synchronous transaction: staged reads/writes, one notification, rollback on throw. */
  batchInteractions(update: (interactions: InteractionWriter<T>) => void): void;
}
