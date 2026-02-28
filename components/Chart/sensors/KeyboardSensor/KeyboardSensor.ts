import { InputAction } from "../../engine";
import { resolveAccessor } from "../../types/accessors";
import { Sensor } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";

/**
 * Professional-grade Keyboard Sensor for A11y.
 * Allows navigating data points using ArrowKeys.
 */
export const KeyboardSensor = (options: { name?: string } = {}): Sensor => {
  const { name = InteractionChannel.PRIMARY_HOVER } = options;
  let focusedIndex = -1;

  return (event, { getChartContext, upsertInteraction, removeInteraction }) => {
    const { signal } = event;

    // Only handle KEY actions
    if (signal.action !== InputAction.KEY || !signal.key) {
      return;
    }

    const ctx = getChartContext();
    const { chartStore } = ctx;
    const state = chartStore.getState();
    const { data, scales, config } = state;

    if (!data || data.length === 0 || !scales.x) {
      return;
    }

    // Update Focus
    let changed = false;
    if (signal.key === "ArrowRight") {
      focusedIndex = Math.min(focusedIndex + 1, data.length - 1);
      changed = true;
    } else if (signal.key === "ArrowLeft") {
      focusedIndex = Math.max(focusedIndex - 1, 0);
      changed = true;
      if (focusedIndex < 0) {
        focusedIndex = 0;
      }
    } else if (signal.key === "Escape") {
      focusedIndex = -1;
      removeInteraction(name);
      return;
    }

    if (changed && focusedIndex >= 0) {
      const d = data[focusedIndex];
      const { x: xScale, y: yScale } = scales;

      // Resolve coordinates
      // TODO: Accessor resolution should be centralized or consistent with Root
      const xAcc = (config as any).x || ((v: any) => v[0]); // fallback
      const yAcc = (config as any).y || ((v: any) => v[1]);

      const getX = resolveAccessor(xAcc);
      const getY = resolveAccessor(yAcc);

      const xVal = getX(d);
      const yVal = getY(d);

      const xPos = (xScale as any)(xVal) || 0;
      const yPos = (yScale as any)(yVal) || 0;

      // Query Engine for targets at this location (Vertical Slice)
      // We use a small search radius to mimic "nearest" behavior if needed,
      // but typically we want everything at this X.
      // The spatial index might be quadtree.
      // For now, let's use the primary data point we just found as the target
      // + any others the engine finds nearby.

      // Simplest interaction: Just highlight the data point we navigated to.
      // If we want multi-series, we should query engine.
      // const candidates = engine.spatialIndex?.find(xPos, yPos, 10) || [];

      // Construct target manually since we know the data point
      const primaryTarget = {
        type: "data-point",
        data: d,
        seriesId: "default", // TODO: Multi-series support
        dataIndex: focusedIndex,
        coordinate: { x: xPos, y: yPos },
        distance: 0,
      };

      upsertInteraction(name, {
        pointer: {
          x: xPos,
          y: yPos,
          containerX: xPos + state.dimensions.margin.left,
          containerY: yPos + state.dimensions.margin.top,
          isTouch: false,
        },
        targets: [primaryTarget as any], // Cast to InteractionTarget
        target: primaryTarget as any,
      });
    }
  };
};
