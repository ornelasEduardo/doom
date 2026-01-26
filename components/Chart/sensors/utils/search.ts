import { State } from "../../state/store/chart.store";
import { ChartEvent } from "../../types/events";
import { HoverMode, InteractionTarget } from "../../types/interaction";
import { Series } from "../../types/series";

export interface SearchResult {
  targets: InteractionTarget[];
  coordinate: { x: number; y: number };
}

const INTERACTION_RADIUS = 50;

/**
 * Coordinated search logic to find target(s) across all registered series.
 * This is the "Engine" of the sensor architecture.
 */
export const findClosestTargets = (
  event: ChartEvent,
  mode: HoverMode,
  state: State,
): InteractionTarget[] => {
  const { processedSeries, scales } = state;
  const { x: xScale, y: yScale } = scales;

  if (!xScale || !yScale) {
    return [];
  }

  const chartX = event.coordinates.chartX;
  const chartY = event.coordinates.chartY;

  // Exact target finding (DOM fallback)
  if (mode === "exact") {
    const domTarget = event.nativeEvent.target as any;
    if (domTarget && domTarget.__data__) {
      return [
        {
          data: domTarget.__data__,
          coordinate: { x: chartX, y: chartY },
        },
      ];
    }
    return [];
  }

  const targets: InteractionTarget[] = [];

  // 1. Iterate over all registered series
  processedSeries.forEach((series: Series) => {
    // If no strategy assigned (legacy/error case), fallback or skip
    if (!series.strategy) {
      return;
    }

    const result = series.strategy.find(
      chartX,
      chartY,
      INTERACTION_RADIUS,
      xScale as any,
      yScale as any,
    );

    if (result) {
      targets.push(result);
    }
  });

  return targets;
};
