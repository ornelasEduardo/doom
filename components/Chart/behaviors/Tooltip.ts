import type { ReactNode } from "react";

import { Behavior, GenericBehavior } from "../types/events";
import {
  ChannelReference,
  HoverInteraction,
  InteractionChannel,
  InteractionTarget,
} from "../types/interaction";

export interface TooltipContent<T> {
  data: T[];
  targets: InteractionTarget<T>[];
  /** Resolved tooltip anchor: current target position for target-anchored readings. */
  pointer: HoverInteraction<T>["pointer"];
}

export interface TooltipOptions<T = unknown> {
  /** Interaction channel to display. Defaults to primary hover. */
  on?: ChannelReference<HoverInteraction<T>>;
  /** Receives the same payload shape for one or many targets. */
  render?: (content: TooltipContent<T>) => ReactNode;
}

let nextTooltipOwner = 0;

/** Registers one independently owned tooltip, released when the behavior detaches. */
export function Tooltip(options?: { on?: string }): GenericBehavior;
export function Tooltip<T>(options: TooltipOptions<T>): Behavior<T>;
export function Tooltip<T = unknown>(
  options: TooltipOptions<T> = {},
): Behavior<T> {
  const { on = InteractionChannel.PRIMARY_HOVER } = options;
  return ({ upsertInteraction, removeInteraction }) => {
    const key =
      `${InteractionChannel.TOOLTIP_CONFIG}:${++nextTooltipOwner}` as const;
    upsertInteraction(key, { ...options, on });
    return () => {
      removeInteraction(key);
    };
  };
}
