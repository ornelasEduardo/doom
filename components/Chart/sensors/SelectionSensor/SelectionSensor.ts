import { ChartEvent, Sensor } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { findClosestTargets } from "../utils/search";

/**
 * Professional-grade Selection Sensor.
 * Coordinates with search logic to choose data points on click.
 */
export const SelectionSensor = (options: { name?: string } = {}): Sensor => {
  const { name = InteractionChannel.SELECTION } = options;

  return ({ on, off, getChartContext, upsertInteraction }) => {
    const handleDown = (event: ChartEvent) => {
      const ctx = getChartContext();
      if (!ctx || !ctx.chartStore) {
        return;
      }

      const state = ctx.chartStore.getState();

      /**
       * For selection, we usually want 'closest' or 'exact' mode to ensure
       * the user clicked precisely what they intended.
       */
      const targets = findClosestTargets(event, "closest", state);

      if (targets.length > 0) {
        const selectedDatum = targets[0].data;
        const currentSelection = state.interactions.get(name)?.selection || [];

        // Simple toggle logic
        const isAlreadySelected = currentSelection.includes(selectedDatum);
        const nextSelection = isAlreadySelected
          ? currentSelection.filter((d: any) => d !== selectedDatum)
          : [...currentSelection, selectedDatum];

        upsertInteraction(name, {
          selection: nextSelection,
          mode: "discrete",
        });
      }
    };

    on("CHART_POINTER_DOWN", handleDown);

    return () => {
      off("CHART_POINTER_DOWN", handleDown);
    };
  };
};
