import { InputAction, InteractionCandidate } from "../../engine";
import { GenericSensor, Sensor } from "../../types/events";
import {
  ChannelReference,
  HoverInteraction,
  InteractionChannel,
  InteractionChannelHandle,
} from "../../types/interaction";

export interface HoverSensorOptions<T = unknown> {
  /**
   * Name for the interaction channel.
   * Defaults to 'primary-hover'.
   */
  name?: ChannelReference<HoverInteraction<T>>;

  /** Exact requires a DOM hit; topmost prefers the front DOM hit; nearest minimizes SVG distance. */
  hitPolicy?: "exact" | "topmost" | "nearest";

  /**
   * When true, all series at the selected candidate's slice position are included
   * as targets (vertical-slice behaviour). Useful for multi-series line/bar/area
   * charts where series share the same X domain values.
   * @default false
   */
  verticalSlice?: boolean;
}

/**
 * The DataHoverSensor detects pointer movements over the chart plot
 * and identifies the closest data targets.
 */
export function DataHoverSensor(
  options?: Omit<HoverSensorOptions, "name"> & { name?: string },
): GenericSensor;
export function DataHoverSensor<T>(
  options: HoverSensorOptions<T> & {
    name: InteractionChannelHandle<HoverInteraction<T>>;
  },
): Sensor<T>;
export function DataHoverSensor<T>(
  options: HoverSensorOptions<T> = {},
): Sensor<T> {
  const {
    name = InteractionChannel.PRIMARY_HOVER,
    verticalSlice = false,
    hitPolicy = "topmost",
  } = options;

  return (
    event,
    { upsertHoverInteraction, removeInteraction, getChartContext },
  ) => {
    const remove = () => {
      if (typeof name === "string") {
        removeInteraction(name);
      } else {
        removeInteraction(name);
      }
    };
    const {
      signal,
      primaryCandidate,
      candidates,
      sliceCandidates,
      chartX,
      chartY,
      isWithinPlot,
    } = event;

    if (
      signal.action !== InputAction.MOVE &&
      signal.action !== InputAction.CANCEL &&
      !(signal.source === "touch" && signal.action === InputAction.START)
    ) {
      return;
    }

    if (
      signal.action === InputAction.CANCEL ||
      (!isWithinPlot &&
        (signal.source !== "touch" || signal.action === InputAction.START))
    ) {
      remove();
      return;
    }

    const eligible = candidates.filter(hasData);
    const candidate =
      hitPolicy === "nearest"
        ? eligible.reduce<(typeof eligible)[number] | undefined>(
            (nearest, next) =>
              !nearest || next.distance < nearest.distance ? next : nearest,
            undefined,
          )
        : (eligible.find((next) => next.element) ??
          (hitPolicy === "exact" ? undefined : eligible[0]));

    if (candidate) {
      const isTouch = signal.source === "touch";

      const slice = verticalSlice
        ? candidate === primaryCandidate
          ? sliceCandidates
          : getChartContext().engine.resolveSlice(candidate)
        : [];
      const validSlice = slice.filter(hasData);
      const targets = validSlice.length ? validSlice : [candidate];

      const interaction: HoverInteraction<T> = {
        pointer: {
          x: chartX,
          y: chartY,
          containerX: signal.x,
          containerY: signal.y,
          isTouch,
        },
        targets,
      };
      if (typeof name === "string") {
        upsertHoverInteraction(name, interaction);
      } else {
        upsertHoverInteraction(name, interaction);
      }
    } else {
      remove();
    }
  };
}

function hasData<T>(
  candidate: InteractionCandidate<T>,
): candidate is InteractionCandidate<T> & { data: T } {
  return candidate.data !== undefined;
}
