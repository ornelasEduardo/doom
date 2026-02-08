import { InputAction } from "../../engine";
import { Sensor } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";

/**
 * Professional-grade Selection Sensor.
 * Coordinates with Engine to choose data points on click/start.
 *
 * HYPER-ENGINE UPDATE:
 * - Uses EngineEvent primaryCandidate.
 */
export const SelectionSensor = (options: { name?: string } = {}): Sensor => {
  const { name = InteractionChannel.SELECTION } = options;

  return (
    { signal, primaryCandidate },
    { getChartContext, upsertInteraction },
  ) => {
    // Only handle START action (roughly equivalent to mouse down)
    if (signal.action !== InputAction.START) {
      return;
    }

    if (!primaryCandidate) {
      return;
    }

    const ctx = getChartContext();
    const { chartStore } = ctx;
    const state = chartStore.getState();

    const selectedDatum = primaryCandidate.data;
    const currentInteraction = state.interactions.get(name);
    const currentSelection = (currentInteraction as any)?.selection || [];

    // Simple toggle logic
    // TODO: support multi-select with shift key?
    // signal.originalEvent is the native event if we need modifiers.
    const isAlreadySelected = currentSelection.includes(selectedDatum);

    let nextSelection;
    if (isAlreadySelected) {
      nextSelection = currentSelection.filter((d: any) => d !== selectedDatum);
    } else {
      nextSelection = [...currentSelection, selectedDatum];
    }

    upsertInteraction(name, {
      selection: nextSelection,
      mode: "discrete", // or "continuous"
    });
  };
};
