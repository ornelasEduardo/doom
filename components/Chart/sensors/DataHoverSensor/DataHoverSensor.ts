import { ChartEvent, Sensor } from "../../types/events";
import { HoverMode, InteractionChannel } from "../../types/interaction";
import { findClosestTargets } from "../utils/search";

export interface HoverSensorOptions {
  /**
   * How to find the target.
   */
  mode: HoverMode;

  /**
   * Name for the interaction channel.
   * Defaults to 'primary-hover'.
   */
  name?: InteractionChannel | string;
}

/**
 * The DataHoverSensor detects pointer movements over the chart plot
 * and identifies the closest data targets based on the specified mode.
 *
 * It coordinates with the interaction store to trigger hover-based
 * behaviors like tooltips and markers.
 *
 * @example
 * ```tsx
 * Root({ sensors: [DataHoverSensor()] })
 * ```
 *
 * @example
 * ```tsx
 * DataHoverSensor({ mode: 'exact' })
 * ```
 */
export const DataHoverSensor = (
  options: HoverSensorOptions = { mode: "nearest-x" },
): Sensor => {
  const { mode, name = InteractionChannel.PRIMARY_HOVER } = options;

  return ({
    on,
    off,
    getChartContext,
    upsertInteraction,
    removeInteraction,
  }) => {
    const handleMove = (event: ChartEvent) => {
      const ctx = getChartContext();
      if (!ctx || !ctx.chartStore) {
        return;
      }

      const state = ctx.chartStore.getState();
      const targets = findClosestTargets(event, mode, state);

      if (targets.length > 0) {
        const isTouch =
          "touches" in event.nativeEvent ||
          "changedTouches" in event.nativeEvent;

        upsertInteraction(name, {
          pointer: {
            x: event.coordinates.chartX,
            y: event.coordinates.chartY,
            containerX: event.coordinates.containerX,
            containerY: event.coordinates.containerY,
            isTouch,
          },
          targets,
        });
      } else {
        removeInteraction(name);
      }
    };

    const handleLeave = () => {
      removeInteraction(name);
    };

    on("CHART_POINTER_MOVE", handleMove);
    on("CHART_POINTER_LEAVE", handleLeave);

    return () => {
      off("CHART_POINTER_MOVE", handleMove);
      off("CHART_POINTER_LEAVE", handleLeave);
    };
  };
};
