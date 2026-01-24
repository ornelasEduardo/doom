import {
  removeInteraction,
  upsertInteraction,
} from "../../state/store/stores/interaction/interaction.store";
import { ChartBehavior, ChartEvent } from "../../types/events";
import { resolveAccessor } from "../../types/index";
import { HoverInteraction, InteractionType } from "../../types/interaction";
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
    const updateTooltip = (event: ChartEvent) => {
      const chartContext = getChartContext();
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
        interactionStore,
      } = chartContext;

      const c = event.coordinates;

      if (!c.isWithinPlot) {
        removeInteraction(interactionStore, InteractionType.HOVER);
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

      let closestData: any = null;

      const processedSeries =
        chartContext.seriesStore.getState().processedSeries;
      const use2DSearch =
        processedSeries &&
        processedSeries.some((s: any) => s.interactionMode === "xy");

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
        closestData = findNearestDataPoint(
          c.chartX,
          data,
          xScale,
          resolveAccessor(x),
        );
      }

      if (closestData) {
        if (config.dataResolver && !config.dataResolver(closestData)) {
          removeInteraction(interactionStore, InteractionType.HOVER);
          return;
        }

        let dataPointX = 0;
        if ((xScale as any).bandwidth) {
          const val = resolveAccessor(x)(closestData);
          dataPointX =
            (xScale(val as any) || 0) + (xScale as any).bandwidth() / 2;
        } else {
          const val = resolveAccessor(x)(closestData);
          dataPointX = xScale(val as any) || 0;
        }

        // Default coordinate: snapped X, actual cursor Y
        // (Could be expanded to snap Y if using findNearestPoint2D)
        const coordinate = {
          x: dataPointX,
          y: c.chartY,
        };

        if (use2DSearch) {
          coordinate.y = yScale(resolveAccessor(y)(closestData) as any);
        }

        const isTouch =
          "touches" in event.nativeEvent ||
          "changedTouches" in event.nativeEvent;

        upsertInteraction<HoverInteraction>(
          interactionStore,
          InteractionType.HOVER,
          {
            pointer: { x: c.containerX, y: c.containerY, isTouch },
            target: {
              data: closestData,
              coordinate,
            },
          },
        );
      }
    };

    const handleMove = (event: ChartEvent) => updateTooltip(event);
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

export default CartesianHover;
