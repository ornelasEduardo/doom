import {
  EngineEvent,
  InputAction,
  type InteractionCandidate,
} from "../../engine";
import { GenericSensor, Sensor } from "../../types/events";
import {
  ChannelReference,
  HoverInteraction,
  InteractionChannel,
} from "../../types/interaction";
import { getInteractionKey } from "../../utils/interactionChannels";
import { buildNavigation, navigationKey } from "./navigation";

// One input may reach supplied and baseline navigators for the same channel.
const handledChannels = new WeakMap<EngineEvent, Set<string | symbol>>();

/**
 * Professional-grade Keyboard Sensor for A11y.
 * Allows navigating data points using ArrowKeys.
 */
export interface KeyboardSensorOptions<T = unknown> {
  name?: ChannelReference<HoverInteraction<T>>;
}

export function KeyboardSensor(options?: { name?: string }): GenericSensor;
export function KeyboardSensor<T>(options: KeyboardSensorOptions<T>): Sensor<T>;
export function KeyboardSensor<T>(
  options: KeyboardSensorOptions<T> = {},
): Sensor<T> {
  const { name = InteractionChannel.PRIMARY_HOVER } = options;
  const channelKey = getInteractionKey(name);
  let focusedIndex = -1;
  let compactCursor: InteractionCandidate<T> | null = null;
  let cached:
    | (ReturnType<typeof buildNavigation<T>> & { key: unknown[] })
    | undefined;

  return (
    event,
    { getChartContext, upsertHoverInteraction, removeInteraction },
  ) => {
    const { signal } = event;
    const remove = () => {
      if (typeof name === "string") {
        removeInteraction(name);
      } else {
        removeInteraction(name);
      }
    };

    // Only handle KEY actions
    if (
      signal.action !== InputAction.KEY ||
      !signal.key ||
      signal.keyPhase === "up" ||
      event.claimed
    ) {
      return;
    }

    if (handledChannels.get(event)?.has(channelKey)) {
      return;
    }

    const ctx = getChartContext();
    const { chartStore } = ctx;
    const state = chartStore.getState();
    const { scales } = state;
    if (signal.key === "Escape") {
      compactCursor = null;
      focusedIndex = -1;
      remove();
      return;
    }
    const forward = signal.key === "ArrowRight" || signal.key === "ArrowDown";
    const backward = signal.key === "ArrowLeft" || signal.key === "ArrowUp";
    if (!forward && !backward) {
      return;
    }
    const { x: xScale, y: yScale } = scales;
    if (!xScale || !yScale) {
      return;
    }
    const compactSlice = ctx.engine?.navigateCompact?.(
      compactCursor,
      forward ? 1 : -1,
    );
    if (compactSlice !== undefined) {
      const compact = compactSlice?.[0];
      if (!compact) {
        compactCursor = null;
        focusedIndex = -1;
        remove();
        return;
      }
      compactCursor = compact;
      const { margin } = state.dimensions;
      const x = compact.coordinate.x - margin.left,
        y = compact.coordinate.y - margin.top;
      const container =
        ctx.engine?.resolveContainerCoordinates(x, y) ?? compact.coordinate;
      upsertHoverInteraction(name, {
        anchor: "target",
        pointer: {
          x,
          y,
          containerX: container.x,
          containerY: container.y,
          isTouch: false,
        },
        targets: compactSlice!,
        target: compact,
      });
      const channels = handledChannels.get(event) ?? new Set<string | symbol>();
      channels.add(channelKey);
      handledChannels.set(event, channels);
      event.handled = true;
      return;
    }
    compactCursor = null;
    const key = navigationKey(state, ctx.engine);
    if (
      !cached ||
      !key.every((value, index) => Object.is(value, cached?.key[index])) ||
      key.length !== cached.key.length
    ) {
      const navigation = buildNavigation(state, ctx.engine);
      cached = { key, ...navigation };
    }
    const { slices } = cached;
    // DOM marks can change without publishing geometry; keep their lookup live.
    if (!cached.cacheable || ctx.engine?.getGeometryRevision?.() == null) {
      cached = undefined;
    }

    if (!slices.length) {
      focusedIndex = -1;
      remove();
      return;
    }
    focusedIndex = forward
      ? Math.min(focusedIndex + 1, slices.length - 1)
      : Math.min(Math.max(focusedIndex - 1, 0), slices.length - 1);
    const point = slices[focusedIndex][0].coordinate;
    const { margin } = state.dimensions;
    // Targets use SVG coordinates; the pointer remains relative to the inner plot.
    const targets = slices[focusedIndex].map((target) => ({
      ...target,
      coordinate: {
        x: target.coordinate.x + margin.left,
        y: target.coordinate.y + margin.top,
      },
    }));
    const target = targets[0];
    const containerPoint =
      ctx.engine?.resolveContainerCoordinates(point.x, point.y) ??
      target.coordinate;
    const interaction: HoverInteraction<T> = {
      anchor: "target",
      pointer: {
        x: point.x,
        y: point.y,
        containerX: containerPoint.x,
        containerY: containerPoint.y,
        isTouch: false,
      },
      targets,
      target,
    };
    upsertHoverInteraction(name, interaction);
    const channels = handledChannels.get(event) ?? new Set<string | symbol>();
    channels.add(channelKey);
    handledChannels.set(event, channels);
    event.handled = true;
  };
}
