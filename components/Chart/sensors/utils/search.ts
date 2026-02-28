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
  radius: number = INTERACTION_RADIUS,
): InteractionTarget[] => {
  const chartX = event.coordinates.chartX;
  const chartY = event.coordinates.chartY;

  // Exact target finding (DOM hit-test) - Uses elementFromPoint since
  // events are captured at container level, not individual elements
  if (mode === "exact") {
    // First check if the event target itself has __data__ (direct click on element)
    const directTarget = event.nativeEvent.target as
      | HTMLElement
      | SVGElement
      | null;

    if (directTarget && (directTarget as any).__data__) {
      return [
        {
          data: (directTarget as any).__data__,
          coordinate: { x: chartX, y: chartY },
          seriesColor:
            (directTarget as Element).getAttribute?.("fill") || undefined,
        },
      ];
    }

    // Use elementFromPoint to find what's under the cursor
    // IMPORTANT: Use the event target's ownerDocument for correct context (handles iframes)
    const pointerEvent = event.nativeEvent as PointerEvent;
    const { clientX, clientY } = pointerEvent;

    // Get the correct document - if the event target is in an iframe,
    // its ownerDocument will be the iframe's document
    const targetDoc = directTarget?.ownerDocument || document;
    const domTarget = targetDoc.elementFromPoint(clientX, clientY);

    if (domTarget && (domTarget as any).__data__) {
      return [
        {
          data: (domTarget as any).__data__,
          coordinate: { x: chartX, y: chartY },
          seriesColor: domTarget.getAttribute?.("fill") || undefined,
        },
      ];
    }
    return [];
  }

  const { processedSeries, scales } = state;
  const { x: xScale, y: yScale } = scales;

  if (!xScale || !yScale) {
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
      radius,
      xScale as any,
      yScale as any,
    );

    if (result) {
      targets.push(result);
    }
  });

  return targets;
};
