import { ChartEvent, Sensor } from "../types/events";
import { InteractionChannel } from "../types/interaction";
import { findClosestTargets } from "./utils/search";

/**
 * Professional-grade Keyboard Sensor for A11y.
 * Allows navigating data points using ArrowKeys.
 */
export const KeyboardSensor = (options: { name?: string } = {}): Sensor => {
  const { name = InteractionChannel.PRIMARY_HOVER } = options;
  let focusedIndex = -1;

  return ({
    on,
    off,
    getChartContext,
    upsertInteraction,
    removeInteraction,
  }) => {
    const handleKeyDown = (event: ChartEvent) => {
      const native = event.nativeEvent as KeyboardEvent;
      const ctx = getChartContext();
      if (!ctx || !ctx.chartStore) {
        return;
      }

      const state = ctx.chartStore.getState();
      const { data, scales } = state;

      if (!data || data.length === 0 || !scales.x) {
        return;
      }

      if (native.key === "ArrowRight") {
        focusedIndex = Math.min(focusedIndex + 1, data.length - 1);
        native.preventDefault();
      } else if (native.key === "ArrowLeft") {
        focusedIndex = Math.max(focusedIndex - 1, 0);
        native.preventDefault();
      } else if (native.key === "Escape") {
        focusedIndex = -1;
        removeInteraction(name);
        return;
      } else {
        return;
      }

      if (focusedIndex >= 0) {
        const d = data[focusedIndex];
        const { x: xScale, y: yScale } = scales;

        // Resolve coordinates for the primary series/config
        const xAcc = (state.config as any).x || ((v: any) => v[0]);
        const yAcc = (state.config as any).y || ((v: any) => v[1]);

        const xVal =
          typeof xAcc === "function" ? xAcc(d) : d[xAcc as keyof typeof d];
        const yVal =
          typeof yAcc === "function" ? yAcc(d) : d[yAcc as keyof typeof d];

        const xPos = (xScale as any)(xVal) || 0;
        const yPos = (yScale as any)(yVal) || 0;

        // Leverage centralized search logic to identify targets at the keyboard-focused point.
        // This coordinates keyboard navigation with multi-series data processing.
        const focusEvent: ChartEvent = {
          type: "CHART_POINTER_MOVE",
          nativeEvent: native,
          coordinates: {
            chartX: xPos,
            chartY: yPos,
            containerX: xPos,
            containerY: yPos,
            isWithinPlot: true,
          },
        };

        const targets = findClosestTargets(focusEvent, "nearest-x", state);

        if (targets.length > 0) {
          upsertInteraction(name, {
            pointer: {
              x: xPos,
              y: yPos,
              containerX: xPos,
              containerY: yPos,
              isTouch: false,
            },
            targets,
            target: targets[0],
          });
        }
      }
    };

    on("CHART_KEY_DOWN", handleKeyDown);

    return () => {
      off("CHART_KEY_DOWN", handleKeyDown);
    };
  };
};
