import { ChartEvent, Sensor } from "../../types/events";
import {
  DragInteraction,
  InteractionChannel,
  InteractionTarget,
} from "../../types/interaction";
import { findClosestTargets } from "../utils/search";

export interface DragSensorOptions<T = any> {
  /**
   * Interaction channel name.
   * @default InteractionChannel.DRAG
   */
  name?: InteractionChannel | string;

  /**
   * Callback fired when a drag ends.
   */
  onDragEnd?: (
    originalData: T,
    newValue: { x: any; y: any },
    pixelPosition: { x: number; y: number },
  ) => void;

  /**
   * Callback fired during drag.
   */
  onDrag?: (
    originalData: T,
    currentValue: { x: any; y: any },
    pixelPosition: { x: number; y: number },
  ) => void;

  /**
   * Radius in pixels for hit detection.
   * @default 20
   */
  hitRadius?: number;

  /**
   * Hit detection mode.
   * - "exact": Uses DOM hit detection (requires __data__ on elements)
   * - "closest": Uses strategy-based search (requires invertable scales)
   * @default "exact"
   */
  hitMode?: "exact" | "closest";
}

/**
 * DragSensor enables dragging data points ("pucks") on a chart.
 *
 * It uses the existing search strategies to detect which point the user
 * clicked, then tracks the drag and inverts pixel coordinates back to
 * data domain values.
 *
 * @example
 * ```tsx
 * DragSensor({
 *   onDragEnd: (data, newValue) => {
 *     console.log(`Dragged ${data.label} to ${newValue.y}`);
 *   }
 * })
 * ```
 */
export const DragSensor = <T = any>(
  options: DragSensorOptions<T> = {},
): Sensor<T> => {
  const {
    name = InteractionChannel.DRAG,
    onDragEnd,
    onDrag,
    hitRadius = 20,
    hitMode = "exact",
  } = options;

  return ({
    on,
    off,
    getChartContext,
    upsertInteraction,
    removeInteraction,
  }) => {
    let dragTarget: InteractionTarget<T> | null = null;
    let startPosition: { x: number; y: number } | null = null;

    const handlePointerDown = (event: ChartEvent) => {
      const ctx = getChartContext();
      if (!ctx || !ctx.chartStore) {
        return;
      }

      const state = ctx.chartStore.getState();

      // Find targets at click position
      const targets = findClosestTargets(event, hitMode, state, hitRadius);

      if (targets.length > 0) {
        // If multiple targets, prioritize by distance or z-index (implicit in order)
        // For drag, we take the first valid target
        // IMPORTANT: We must store the DATA associated with the target, not just the element
        const target = targets[0];

        let initialData = target.data;
        if (!initialData && target.element) {
          // Fallback: try to get data from element property if strict typing allows
          initialData = (target.element as any).__data__;
        }

        // Only start drag if we have data to update
        if (initialData) {
          // Construct a full InteractionTarget
          const interactionTarget: InteractionTarget = {
            data: initialData,
            coordinate: target.coordinate || {
              x: event.coordinates.chartX,
              y: event.coordinates.chartY,
            },
            seriesId: target.seriesId,
            seriesColor: target.seriesColor,
          };

          dragTarget = {
            element: target.element,
            data: initialData,
            // Store the full interaction target for later use
            interactionTarget,
          };

          startPosition = {
            x: event.coordinates.chartX,
            y: event.coordinates.chartY,
          };

          // Register interaction
          const interaction: DragInteraction = {
            target: interactionTarget,
            startPosition,
            currentPosition: startPosition,
            currentValue: { x: null, y: null }, // Initial value will be populated on move
            isDragging: true,
          };

          upsertInteraction(name, interaction);
        }
      }
    };

    const handlePointerMove = (event: ChartEvent) => {
      if (!dragTarget || !startPosition) {
        return;
      }

      // 1. Calculate delta
      // 2. Update interaction state with new position
      // 3. Fire onDrag callback

      const currentPosition = {
        x: event.coordinates.chartX,
        y: event.coordinates.chartY,
      };

      const ctx = getChartContext();
      if (!ctx || !ctx.chartStore) {
        return;
      }

      const state = ctx.chartStore.getState();
      const { x: xScale, y: yScale } = state.scales;

      // Invert to get value
      let xValue: any = null;
      let yValue: any = null;

      if (xScale && "invert" in xScale) {
        xValue = xScale.invert(currentPosition.x);
      }
      if (yScale && "invert" in yScale) {
        yValue = yScale.invert(currentPosition.y);
      }

      const currentValue = { x: xValue, y: yValue };

      // Update interaction state
      const interaction: DragInteraction = {
        target: dragTarget.interactionTarget,
        startPosition,
        currentPosition,
        currentValue,
        isDragging: true,
      };

      upsertInteraction(name, interaction);

      if (onDrag) {
        onDrag(dragTarget.data, currentValue, currentPosition);
      }
    };

    const handlePointerUp = (event: ChartEvent) => {
      if (!dragTarget || !startPosition) {
        return;
      }

      const ctx = getChartContext();
      if (!ctx || !ctx.chartStore) {
        dragTarget = null;
        startPosition = null;
        removeInteraction(name);
        return;
      }

      const state = ctx.chartStore.getState();
      const { x: xScale, y: yScale } = state.scales;

      const finalPosition = {
        x: event.coordinates.chartX,
        y: event.coordinates.chartY,
      };

      // Invert final position to data domain
      let xValue: any = null;
      let yValue: any = null;

      if (xScale && "invert" in xScale) {
        xValue = xScale.invert(finalPosition.x);
      }
      if (yScale && "invert" in yScale) {
        yValue = yScale.invert(finalPosition.y);
      }

      if (onDragEnd) {
        onDragEnd(dragTarget.data, { x: xValue, y: yValue }, finalPosition);
      }

      // Clean up
      dragTarget = null;
      startPosition = null;
      removeInteraction(name);
    };

    const handlePointerLeave = () => {
      if (dragTarget) {
        // Cancel drag on leave
        dragTarget = null;
        startPosition = null;
        removeInteraction(name);
      }
    };

    on("CHART_POINTER_DOWN", handlePointerDown);
    on("CHART_POINTER_MOVE", handlePointerMove);
    on("CHART_POINTER_UP", handlePointerUp);
    on("CHART_POINTER_LEAVE", handlePointerLeave);

    return () => {
      off("CHART_POINTER_DOWN", handlePointerDown);
      off("CHART_POINTER_MOVE", handlePointerMove);
      off("CHART_POINTER_UP", handlePointerUp);
      off("CHART_POINTER_LEAVE", handlePointerLeave);
    };
  };
};
