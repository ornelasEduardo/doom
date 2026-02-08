import { InputAction } from "../../engine";
import { Sensor } from "../../types/events";
import {
  DragInteraction,
  InteractionChannel,
  InteractionTarget,
} from "../../types/interaction";

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
}

/**
 * DragSensor enables dragging data points ("pucks") on a chart.
 *
 * HYPER-ENGINE UPDATE:
 * - Uses EngineEvent candidates for hit detection.
 * - Manages drag state via closure.
 */
export const DragSensor = <T = any>(
  options: DragSensorOptions<T> = {},
): Sensor<T> => {
  const {
    name = InteractionChannel.DRAG,
    onDragEnd,
    onDrag,
    hitRadius = 20,
  } = options;

  let isDragging = false;
  let dragTarget: InteractionTarget<T> | null = null;
  let startPosition: { x: number; y: number } | null = null;

  return (event, { getChartContext, upsertInteraction, removeInteraction }) => {
    const { signal, primaryCandidate, chartX, chartY } = event;

    // 1. START DRAG
    if (signal.action === InputAction.START) {
      if (primaryCandidate && primaryCandidate.distance <= hitRadius) {
        // Start dragging exact target
        const target = primaryCandidate;
        const initialData = target.data as T;

        if (initialData) {
          isDragging = true;
          startPosition = { x: chartX, y: chartY };

          const interactionTarget: InteractionTarget<T> = {
            data: initialData,
            coordinate: target.coordinate,
            seriesId: target.seriesId,
          };

          dragTarget = interactionTarget;

          // Register interaction
          const interaction: DragInteraction<T> = {
            target: interactionTarget,
            startPosition,
            currentPosition: startPosition,
            currentValue: { x: null, y: null },
            isDragging: true,
          };

          upsertInteraction(name, interaction);
        }
      }
      return;
    }

    // 2. MOVE DRAG
    if (signal.action === InputAction.MOVE) {
      if (!isDragging || !dragTarget || !startPosition) {
        return;
      }

      const currentPosition = { x: chartX, y: chartY };
      const ctx = getChartContext();
      if (!ctx || !ctx.chartStore) {
        return;
      }

      const state = ctx.chartStore.getState();
      const { x: xScale, y: yScale } = state.scales;

      // Invert
      let xValue: any = null;
      let yValue: any = null;

      if (xScale && "invert" in xScale) {
        xValue = xScale.invert(currentPosition.x);
      }
      if (yScale && "invert" in yScale) {
        yValue = yScale.invert(currentPosition.y);
      }

      const currentValue = { x: xValue, y: yValue };

      // Update interaction
      const interaction: DragInteraction<T> = {
        target: dragTarget,
        startPosition,
        currentPosition,
        currentValue,
        isDragging: true,
      };

      upsertInteraction(name, interaction);

      if (onDrag) {
        onDrag(dragTarget.data, currentValue, currentPosition);
      }
      return;
    }

    // 3. END / CANCEL DRAG
    if (
      signal.action === InputAction.END ||
      signal.action === InputAction.CANCEL
    ) {
      if (!isDragging || !dragTarget) {
        return;
      }

      const finalPosition = { x: chartX, y: chartY };
      const ctx = getChartContext();
      const state = ctx.chartStore.getState();
      const { x: xScale, y: yScale } = state.scales;

      let xValue: any = null;
      let yValue: any = null;

      if (xScale && "invert" in xScale) {
        xValue = xScale.invert(finalPosition.x);
      }
      if (yScale && "invert" in yScale) {
        yValue = yScale.invert(finalPosition.y);
      }

      if (signal.action === InputAction.END && onDragEnd) {
        onDragEnd(dragTarget.data, { x: xValue, y: yValue }, finalPosition);
      }

      // Cleanup
      isDragging = false;
      dragTarget = null;
      startPosition = null;
      removeInteraction(name);
    }
  };
};
