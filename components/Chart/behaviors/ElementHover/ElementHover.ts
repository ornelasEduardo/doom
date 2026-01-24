import {
  removeInteraction,
  upsertInteraction,
} from "../../state/store/stores/interaction/interaction.store";
import { ChartBehavior, ChartEvent } from "../../types/events";
import { HoverInteraction, InteractionType } from "../../types/interaction";

export interface ElementHoverOptions {
  /**
   * Resolver function to determine if a hovered element is a valid target.
   * Returns true to activate hover state.
   */
  targetResolver?: (element: Element) => boolean;

  /**
   * Optional: Transform or extract data from the hovered element.
   * useful if the D3 __data__ property isn't exactly what you want in the tooltip.
   */
  getData?: (element: Element, d3Data: any) => any;
}

export const ElementHover = (
  options: ElementHoverOptions = {},
): ChartBehavior => {
  return ({ on, off, getChartContext }) => {
    const handleMove = (event: ChartEvent) => {
      const ctx = getChartContext();
      if (!ctx || !ctx.resolveInteraction || !ctx.interactionStore) {
        return;
      }

      const result = ctx.resolveInteraction(event.nativeEvent);

      if (result) {
        const { element, data: d3Data } = result;

        // Check against resolver if provided
        if (
          options.targetResolver &&
          !options.targetResolver(element as Element)
        ) {
          removeInteraction(ctx.interactionStore, InteractionType.HOVER);
          return;
        }

        // It matches (or no resolver provided).
        const finalData = options.getData
          ? options.getData(element as Element, d3Data)
          : d3Data;

        const isTouch =
          "touches" in event.nativeEvent ||
          "changedTouches" in event.nativeEvent;

        upsertInteraction<HoverInteraction>(
          ctx.interactionStore,
          InteractionType.HOVER,
          {
            pointer: {
              x: event.coordinates.containerX,
              y: event.coordinates.containerY,
              isTouch,
            },
            target: {
              data: finalData,
              coordinate: {
                x: event.coordinates.chartX,
                y: event.coordinates.chartY,
              },
            },
          },
        );
      } else {
        removeInteraction(ctx.interactionStore, InteractionType.HOVER);
      }
    };

    const handleLeave = () => {
      const ctx = getChartContext();
      if (ctx?.interactionStore) {
        removeInteraction(ctx.interactionStore, InteractionType.HOVER);
      }
    };

    on("CHART_POINTER_MOVE", handleMove);
    on("CHART_POINTER_LEAVE", handleLeave);

    return () => {
      off("CHART_POINTER_MOVE", handleMove);
      off("CHART_POINTER_LEAVE", handleLeave);
    };
  };
};
