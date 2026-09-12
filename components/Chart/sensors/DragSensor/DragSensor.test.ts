/**
 * DragSensor Tests (Engine Architecture)
 */

import { describe, expect, it, vi } from "vitest";

import { EngineEvent, InputAction, InputSource } from "../../engine";
import { SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { DragSensor } from "./DragSensor";

// =============================================================================
// MOCK SETUP
// =============================================================================

const createMockContext = (): SensorContext => {
  const interactions = new Map<string, unknown>();
  const mockData = [
    { x: 0, y: 100, id: "point-0" },
    { x: 1, y: 200, id: "point-1" },
  ];

  return {
    getChartContext: vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: mockData,
          scales: {
            x: Object.assign((v: number) => v * 100, {
              invert: (v: number) => v / 100,
            }),
            y: Object.assign((v: number) => 300 - v, {
              invert: (v: number) => 300 - v,
            }),
          },
          interactions,
        }),
      },
    })) as any,
    getInteraction: vi.fn((name: string) => interactions.get(name) || null),
    upsertInteraction: vi.fn((name: string, interaction: unknown) => {
      interactions.set(name, interaction);
    }),
    removeInteraction: vi.fn((name: string) => {
      interactions.delete(name);
    }),
  } as unknown as SensorContext;
};

const createMockEvent = (
  action: InputAction,
  candidate?: any,
  coords = { x: 0, y: 0 },
): EngineEvent => ({
  signal: {
    action,
    ...coords,
    source: InputSource.MOUSE,
    id: 1,
    timestamp: 0,
    userId: "local",
  },
  primaryCandidate: candidate || null,
  candidates: candidate ? [candidate] : [],
  sliceCandidates: [],
  chartX: coords.x,
  chartY: coords.y,
  isWithinPlot: true,
});

// =============================================================================
// TESTS
// =============================================================================

describe("DragSensor (Engine)", () => {
  it("should start dragging on START action with target", () => {
    const ctx = createMockContext();
    const sensor = DragSensor();
    const dataPoint = { x: 0, y: 100 };
    const candidate = {
      data: dataPoint,
      distance: 0,
      coordinate: { x: 0, y: 100 },
    };

    const event = createMockEvent(InputAction.START, candidate);

    sensor(event, ctx);

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.DRAG,
      expect.objectContaining({
        isDragging: true,
        target: expect.objectContaining({ data: dataPoint }),
      }),
    );
  });

  it("should update drag position on MOVE", () => {
    const ctx = createMockContext();
    const sensor = DragSensor();
    const dataPoint = { x: 0, y: 100 };
    const candidate = {
      data: dataPoint,
      distance: 0,
      coordinate: { x: 0, y: 100 },
    };

    // 1. Start
    sensor(createMockEvent(InputAction.START, candidate), ctx);

    // 2. Move
    const moveEvent = createMockEvent(InputAction.MOVE, candidate, {
      x: 50,
      y: 50,
    });
    sensor(moveEvent, ctx);

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.DRAG,
      expect.objectContaining({
        isDragging: true,
        currentPosition: { x: 50, y: 50 },
        currentValue: { x: 0.5, y: 250 }, // Inverted values (x/100, 300-y)
      }),
    );
  });

  it("should call onDrag callback", () => {
    const onDrag = vi.fn();
    const ctx = createMockContext();
    const sensor = DragSensor({ onDrag });
    const dataPoint = { x: 0, y: 100 };
    const candidate = {
      data: dataPoint,
      distance: 0,
      coordinate: { x: 0, y: 100 },
    };

    // 1. Start
    sensor(createMockEvent(InputAction.START, candidate), ctx);

    // 2. Move
    sensor(createMockEvent(InputAction.MOVE, candidate, { x: 50, y: 50 }), ctx);

    expect(onDrag).toHaveBeenCalledWith(
      dataPoint,
      { x: 0.5, y: 250 },
      { x: 50, y: 50 },
    );
  });

  it("should end drag on END action", () => {
    const onDragEnd = vi.fn();
    const ctx = createMockContext();
    const sensor = DragSensor({ onDragEnd });
    const dataPoint = { x: 0, y: 100 };
    const candidate = {
      data: dataPoint,
      distance: 0,
      coordinate: { x: 0, y: 100 },
    };

    // 1. Start
    sensor(createMockEvent(InputAction.START, candidate), ctx);

    // 2. End
    sensor(
      createMockEvent(InputAction.END, candidate, { x: 100, y: 100 }),
      ctx,
    );

    expect(onDragEnd).toHaveBeenCalledWith(
      dataPoint,
      { x: 1, y: 200 },
      { x: 100, y: 100 },
    );

    expect(ctx.removeInteraction).toHaveBeenCalledWith(InteractionChannel.DRAG);
  });
});

describe("drag ownership", () => {
  const candidate = {
    data: { x: 0, y: 100 },
    distance: 0,
    coordinate: { x: 0, y: 100 },
  };
  it.each([
    InputAction.START,
    InputAction.MOVE,
    InputAction.END,
    InputAction.CANCEL,
  ])("ignores foreign %s", (action) => {
    const ctx = createMockContext();
    const sensor = DragSensor();
    sensor(createMockEvent(InputAction.START, candidate), ctx);
    const foreign = createMockEvent(action, candidate, { x: 80, y: 80 });
    foreign.signal.id = 2;
    sensor(foreign, ctx);
    expect(ctx.getInteraction(InteractionChannel.DRAG)).toMatchObject({
      currentPosition: { x: 0, y: 0 },
    });
  });
  it.each(["onDrag", "onDragEnd"] as const)(
    "cleans up if %s throws",
    (callback) => {
      const ctx = createMockContext();
      const sensor = DragSensor({
        [callback]: () => {
          throw new Error("consumer");
        },
      });
      sensor(createMockEvent(InputAction.START, candidate), ctx);
      expect(() =>
        sensor(
          createMockEvent(
            callback === "onDrag" ? InputAction.MOVE : InputAction.END,
          ),
          ctx,
        ),
      ).toThrow("consumer");
      expect(ctx.getInteraction(InteractionChannel.DRAG)).toBeNull();
      sensor(createMockEvent(InputAction.START, candidate), ctx);
      expect(ctx.getInteraction(InteractionChannel.DRAG)).not.toBeNull();
    },
  );
});

it("chart cancellation clears the drag even from another stream", () => {
  const ctx = createMockContext();
  const end = vi.fn();
  const sensor = DragSensor({ onDragEnd: end });
  sensor(
    createMockEvent(InputAction.START, {
      data: { x: 0, y: 10 },
      distance: 0,
      coordinate: { x: 0, y: 10 },
    }),
    ctx,
  );
  const cancel = createMockEvent(InputAction.CANCEL);
  cancel.signal.id = 99;
  cancel.signal.cancelScope = "chart";
  sensor(cancel, ctx);
  expect(ctx.getInteraction(InteractionChannel.DRAG)).toBeNull();
  expect(end).not.toHaveBeenCalled();
});
