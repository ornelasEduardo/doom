import { InputAction } from "../../engine";
import { Sensor } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";

export interface HoverSensorOptions {
  /**
   * Name for the interaction channel.
   * Defaults to 'primary-hover'.
   */
  name?: InteractionChannel | string;
}

/**
 * The DataHoverSensor detects pointer movements over the chart plot
 * and identifies the closest data targets.
 *
 * HYPER-ENGINE UPDATE:
 * Now purely an interpreter of EngineEvents.
 */
export const DataHoverSensor = (options: HoverSensorOptions = {}): Sensor => {
  const { name = InteractionChannel.PRIMARY_HOVER } = options;

  return (event, { upsertInteraction, removeInteraction }) => {
    const { signal, primaryCandidate, chartX, chartY, isWithinPlot } = event;

    console.log(primaryCandidate, event.candidates);

    // 1. Filter: Only handle MOVE and LEAVE/CANCEL
    if (
      signal.action !== InputAction.MOVE &&
      signal.action !== InputAction.CANCEL
    ) {
      return;
    }

    // 2. Handle LEAVE/CANCEL or strict plot bounds
    if (
      signal.action === InputAction.CANCEL ||
      (!isWithinPlot && signal.source !== "touch") // allow touch to drag off-plot slightly?
    ) {
      removeInteraction(name);
      return;
    }

    // 3. Handle MOVE
    if (primaryCandidate) {
      const isTouch = signal.source === "touch";

      upsertInteraction(name, {
        pointer: {
          x: chartX,
          y: chartY,
          containerX: signal.x,
          containerY: signal.y,
          isTouch,
        },
        targets: [primaryCandidate as any], // Engine provides "hydrated" candidate
      });
    } else {
      // No candidate found, but still hovering plot?
      // Optionally keep interaction but clear targets, or remove.
      // Legacy behavior was to remove if no targets found.
      removeInteraction(name);
    }
  };
};
