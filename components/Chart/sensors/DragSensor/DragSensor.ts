import { InputAction, InputSignal } from "../../engine";
import { GenericSensor, Sensor } from "../../types/events";
import {
  ChannelReference,
  DragInteraction,
  InteractionChannel,
  InteractionTarget,
} from "../../types/interaction";

export interface DragSensorOptions<T = unknown> {
  /**
   * Interaction channel name.
   * @default InteractionChannel.DRAG
   */
  name?: ChannelReference<DragInteraction<T>>;

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
 */
export function DragSensor(
  options?: Omit<DragSensorOptions<unknown>, "name"> & { name?: string },
): GenericSensor;
export function DragSensor<T>(options: DragSensorOptions<T>): Sensor<T>;
export function DragSensor<T>(options: DragSensorOptions<T> = {}): Sensor<T> {
  const {
    name = InteractionChannel.DRAG,
    onDragEnd,
    onDrag,
    hitRadius = 20,
  } = options;

  let owner: Pick<InputSignal, "id" | "source" | "userId"> | null = null;
  let isDragging = false;
  let dragTarget: InteractionTarget<T> | null = null;
  let startPosition: { x: number; y: number } | null = null;

  return (event, { getChartContext, upsertInteraction, removeInteraction }) => {
    const { signal, primaryCandidate, chartX, chartY } = event;

    const write = (interaction: DragInteraction<T>) => {
      if (typeof name === "string") {
        upsertInteraction(name, interaction);
      } else {
        upsertInteraction(name, interaction);
      }
    };
    const cleanup = (cancel = false) => {
      const previousOwner = owner;
      owner = null;
      isDragging = false;
      dragTarget = null;
      startPosition = null;
      try {
        if (cancel && previousOwner) {
          // Deferred MOVE has no native capability; the engine owns capture release.
          getChartContext().engine?.input({
            ...signal,
            ...previousOwner,
            action: InputAction.CANCEL,
            cancelScope: "stream",
            native: undefined,
          });
        } else {
          signal.native?.releasePointer();
        }
      } finally {
        if (typeof name === "string") {
          removeInteraction(name);
        } else {
          removeInteraction(name);
        }
      }
    };
    if (
      signal.action === InputAction.CANCEL &&
      signal.cancelScope === "chart"
    ) {
      if (owner) {
        cleanup();
      }
      return;
    }
    if (
      owner &&
      (owner.id !== signal.id ||
        owner.source !== signal.source ||
        owner.userId !== signal.userId)
    ) {
      return;
    }

    // 1. START DRAG
    if (signal.action === InputAction.START) {
      if (owner || (signal.button !== undefined && signal.button !== 0)) {
        return;
      }
      if (primaryCandidate && primaryCandidate.distance <= hitRadius) {
        // Start dragging exact target
        const target = primaryCandidate;
        const initialData = target.data as T;

        if (initialData) {
          owner = {
            id: signal.id,
            source: signal.source,
            userId: signal.userId,
          };
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

          try {
            signal.native?.capturePointer();
            write(interaction);
          } catch (error) {
            cleanup(true);
            throw error;
          }
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

      write(interaction);

      if (onDrag) {
        try {
          onDrag(dragTarget.data, currentValue, currentPosition);
        } catch (error) {
          cleanup(true);
          throw error;
        }
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

      const data = dragTarget.data;
      cleanup();
      if (signal.action === InputAction.END && onDragEnd) {
        onDragEnd(data, { x: xValue, y: yValue }, finalPosition);
      }
    }
  };
}
