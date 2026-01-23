import { ChartBehavior, ChartEvent } from "../../types/events";
import { resolveAccessor } from "../../types/index";
import {
  findNearestDataPoint,
  findNearestPoint2D,
} from "../../utils/interaction";
import { createScales } from "../../utils/scales";

export interface CartesianHoverOptions {
  mode?: "nearest-x" | "nearest";
  snapToData?: boolean;
  /**
   * Resolver function to determine if a data point is a valid target.
   * Returns true to allow snapping to this point.
   */
  dataResolver?: (data: any) => boolean;
}

export const CartesianHover = (
  config: CartesianHoverOptions = { mode: "nearest-x" },
): ChartBehavior => {
  return ({ on, off, getChartContext }) => {
    // We defer accessing context until the event fires to ensure we always use the latest state
    const updateTooltip = (event: ChartEvent) => {
      const chartContext = getChartContext();
      // Safety check in case context is not available
      if (!chartContext) {
        return;
      }

      const {
        data,
        width,
        height,
        config: chartConfig,
        x,
        y,
        setHoverState,
      } = chartContext;

      const c = event.coordinates;

      // Correct strict "isWithinPlot" check to avoid "Strange Places" bug
      if (!c.isWithinPlot) {
        setHoverState?.(null);
        return;
      }

      if (!x || !y) {
        return;
      }

      const { margin } = chartConfig;

      const scaleCtx = createScales(
        data,
        width,
        height,
        margin,
        resolveAccessor(x),
        resolveAccessor(y),
        chartConfig.type,
      );

      const { xScale, yScale } = scaleCtx;

      // chartX is now relative to the inner plot group (already accounts for margins)
      let closestData: any = null;

      // Detect if we should use 2D nearest point search (for scatter plots, etc.)
      const use2DSearch =
        chartContext.legendItems &&
        chartContext.legendItems.some(
          (item: any) => item.interactionMode === "xy",
        );

      if (use2DSearch) {
        closestData = findNearestPoint2D(
          c.chartX,
          c.chartY,
          data,
          xScale,
          yScale,
          resolveAccessor(x),
          resolveAccessor(y),
        );
      } else {
        // Find nearest data point (1D X-axis search)
        closestData = findNearestDataPoint(
          c.chartX,
          data,
          xScale,
          resolveAccessor(x),
        );
      }

      if (closestData) {
        // Apply resolver if present
        if (config.dataResolver && !config.dataResolver(closestData)) {
          setHoverState?.(null);
          return;
        }

        let dataPointX = 0;
        // For scatter, we might want cursor line to be at the exact point X?
        // Or if we hide cursor line for scatter, it doesn't matter.

        if ((xScale as any).bandwidth) {
          const val = resolveAccessor(x)(closestData);
          dataPointX =
            (xScale(val as any) || 0) + (xScale as any).bandwidth() / 2;
        } else {
          const val = resolveAccessor(x)(closestData);
          dataPointX = xScale(val as any) || 0;
        }

        const isTouch =
          "touches" in event.nativeEvent ||
          "changedTouches" in event.nativeEvent;

        setHoverState?.({
          cursorLineX: dataPointX + margin.left,
          cursorLineY: c.chartY + margin.top, // Use actual cursor Y for now (could snap to data Y)
          tooltipX: c.containerX,
          tooltipY: c.containerY,
          data: closestData,
          isTouch,
        });
      }
    };

    const handleMove = (event: ChartEvent) => updateTooltip(event);
    const handleLeave = () => {
      const ctx = getChartContext();
      ctx?.setHoverState?.(null);
    };

    on("CHART_POINTER_MOVE", handleMove);
    on("CHART_POINTER_LEAVE", handleLeave);

    return () => {
      off("CHART_POINTER_MOVE", handleMove);
      off("CHART_POINTER_LEAVE", handleLeave);
    };
  };
};

export default CartesianHover;
