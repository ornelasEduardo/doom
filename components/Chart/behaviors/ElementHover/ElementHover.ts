import { ChartBehavior, ChartEvent } from "../../types/events";

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
      if (!ctx || !ctx.resolveInteraction) {
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
          // Found an element with data, but it didn't match the resolver.
          // Should we clear hover state? Maybe. For now, let's assume if we are over *something* but it's not a target,
          // we might want to clear.
          // But maybe we are moving from target A to target B.
          // If interaction returns something but resolver fails, it effectively means "nothing of interest here".
          ctx.setHoverState?.(null);
          return;
        }

        // It matches (or no resolver provided).
        const finalData = options.getData
          ? options.getData(element as Element, d3Data)
          : d3Data;

        // We need to calculate tooltip positioning.
        // Since we are doing Element hovering, we likely want the tooltip relative to the element OR cursor.
        // ctx.setHoverState expects tooltipX/Y.

        // Let's use the cursor position from the event for now as the "anchor",
        // but ideally we could support element bounds.
        // The Reposition class in the Tooltip component will handle the actual layout relative to this point.
        // However, Reposition.anchor() takes a point.

        // If we want to anchor to the Element, we should pass element bounds?
        // Current setHoverState interface expects cursorLineX/Y and tooltipX/Y.
        // Let's pass the cursor coordinates as the anchor.

        const isTouch =
          "touches" in event.nativeEvent ||
          "changedTouches" in event.nativeEvent;

        ctx.setHoverState?.({
          cursorLineX: event.coordinates.chartX, // Approximated
          cursorLineY: event.coordinates.chartY,
          tooltipX: event.coordinates.containerX,
          tooltipY: event.coordinates.containerY,
          data: finalData,
          isTouch,
        });
      } else {
        ctx.setHoverState?.(null);
      }
    };

    const handleLeave = () => {
      const ctx = getChartContext();
      ctx?.setHoverState?.(null);
    };

    on("CHART_POINTER_MOVE", handleMove);
    on("CHART_POINTER_LEAVE", handleLeave);
    // Also handle click or down/up if needed? For hover, move is enough.

    return () => {
      off("CHART_POINTER_MOVE", handleMove);
      off("CHART_POINTER_LEAVE", handleLeave);
    };
  };
};
