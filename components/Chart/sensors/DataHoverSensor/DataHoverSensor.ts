import { InputAction } from "../../engine";
import { Sensor } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";

export interface HoverSensorOptions {
  /**
   * Name for the interaction channel.
   * Defaults to 'primary-hover'.
   */
  name?: InteractionChannel | string;

  /**
   * When true, only fire when the pointer is directly over a tagged DOM element
   * (DOM hit-test match). Proximal quadtree candidates that have no backing
   * element are ignored. Useful for area-fill charts like treemaps where
   * magnetic snapping across empty gaps is undesirable.
   * @default false
   */
  exactHit?: boolean;

  /**
   * When true, all series at the primary candidate's X position are included
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
export const DataHoverSensor = (options: HoverSensorOptions = {}): Sensor => {
  const {
    name = InteractionChannel.PRIMARY_HOVER,
    exactHit = false,
    verticalSlice = false,
  } = options;

  return (event, { upsertInteraction, removeInteraction }) => {
    const {
      signal,
      primaryCandidate,
      sliceCandidates,
      chartX,
      chartY,
      isWithinPlot,
    } = event;

    if (
      signal.action !== InputAction.MOVE &&
      signal.action !== InputAction.CANCEL
    ) {
      return;
    }

    if (
      signal.action === InputAction.CANCEL ||
      (!isWithinPlot && signal.source !== "touch")
    ) {
      removeInteraction(name);
      return;
    }

    // When exactHit is true, discard proximal (quadtree-only) candidates that
    // have no backing DOM element — the pointer is over empty space.
    const candidate =
      exactHit && primaryCandidate && !primaryCandidate.element
        ? undefined
        : primaryCandidate;

    if (candidate) {
      const isTouch = signal.source === "touch";

      const targets =
        verticalSlice && sliceCandidates.length > 0
          ? sliceCandidates
          : [candidate as any];

      upsertInteraction(name, {
        pointer: {
          x: chartX,
          y: chartY,
          containerX: signal.x,
          containerY: signal.y,
          isTouch,
        },
        targets,
      });
    } else {
      removeInteraction(name);
    }
  };
};
