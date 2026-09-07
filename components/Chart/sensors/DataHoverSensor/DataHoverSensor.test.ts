/**
 * DataHoverSensor Tests (Engine Architecture)
 */

import { describe, expect, it, vi } from "vitest";

import { Engine, EngineEvent, InputAction, InputSource } from "../../engine";
import { SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { DataHoverSensor } from "./DataHoverSensor";

// =============================================================================
// MOCK SETUP
// =============================================================================

const createMockContext = (): SensorContext => {
  const interactions = new Map<string, unknown>();
  const mockData = [{ x: 0, y: 10, id: "p0" }];

  return {
    getChartContext: vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: mockData,
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
): EngineEvent => ({
  signal: {
    action,
    x: 0,
    y: 0,
    source: InputSource.MOUSE,
    id: 1,
    timestamp: 0,
    userId: "local",
  },
  primaryCandidate: candidate || null,
  candidates: candidate ? [candidate] : [],
  sliceCandidates: [],
  chartX: 0,
  chartY: 0,
  isWithinPlot: true,
});

// =============================================================================
// TESTS
// =============================================================================

describe("DataHoverSensor (Engine)", () => {
  it("should hover data point on MOVE with candidate", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();
    const candidate = {
      data: { id: "p0" },
      distance: 5,
      coordinate: { x: 10, y: 10 },
    };

    const event = createMockEvent(InputAction.MOVE, candidate);
    sensor(event, ctx);

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        targets: [expect.objectContaining({ data: { id: "p0" } })],
      }),
    );
  });

  it("exactHit: true — fires when candidate has a backing DOM element", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor({ exactHit: true });
    const candidate = {
      data: { id: "p0" },
      distance: 5,
      coordinate: { x: 10, y: 10 },
      element: document.createElement("rect"),
    };

    sensor(createMockEvent(InputAction.MOVE, candidate), ctx);

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        targets: [expect.objectContaining({ data: { id: "p0" } })],
      }),
    );
    expect(ctx.removeInteraction).not.toHaveBeenCalled();
  });

  it("exactHit: true — suppresses quadtree-only candidate with no element", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor({ exactHit: true });
    const candidate = {
      data: { id: "p0" },
      distance: 5,
      coordinate: { x: 10, y: 10 },
      // no element field
    };

    sensor(createMockEvent(InputAction.MOVE, candidate), ctx);

    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should clear interaction on LEAVE", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();

    // 1. Hover
    sensor(createMockEvent(InputAction.MOVE, { data: { id: "p0" } }), ctx);

    // Reset mocks to clear previous calls
    (ctx.removeInteraction as any).mockClear();

    // 2. Leave (empty event)
    const emptyEvent = createMockEvent(InputAction.MOVE, null);
    sensor(emptyEvent, ctx);

    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );

    // Reset again
    (ctx.removeInteraction as any).mockClear();

    // Also check CANCEL action
    sensor(createMockEvent(InputAction.CANCEL), ctx);
    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
  });

  it("keeps a touch hover alive outside the plot bounds", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();
    const candidate = {
      data: { id: "p0" },
      distance: 5,
      coordinate: { x: 10, y: 10 },
    };

    // A finger tracking past the plot edge should keep its reading; a mouse
    // leaving the plot should not. The branch exists so the two differ.
    const touchEvent = {
      ...createMockEvent(InputAction.MOVE, candidate),
      isWithinPlot: false,
      signal: {
        action: InputAction.MOVE,
        type: "pointer",
        x: 0,
        y: 0,
        source: "touch",
      },
    } as unknown as EngineEvent;

    sensor(touchEvent, ctx);

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        targets: [expect.objectContaining({ data: { id: "p0" } })],
      }),
    );
  });

  it("drops a mouse hover once it leaves the plot bounds", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();
    const event = {
      ...createMockEvent(InputAction.MOVE, {
        data: { id: "p0" },
        distance: 5,
        coordinate: { x: 10, y: 10 },
      }),
      isWithinPlot: false,
    } as unknown as EngineEvent;

    sensor(event, ctx);

    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });
});

describe("touch inspection", () => {
  it("inspects a vertical slice on touch start and retains it on release", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor({ verticalSlice: true });
    const candidates = [
      {
        type: "data-point" as const,
        data: { value: 10 },
        seriesId: "a",
        coordinate: { x: 10, y: 10 },
        distance: 0,
      },
      {
        type: "data-point" as const,
        data: { value: 20 },
        seriesId: "b",
        coordinate: { x: 10, y: 20 },
        distance: 10,
      },
    ];
    const event = createMockEvent(InputAction.START, candidates[0]);
    event.signal.source = InputSource.TOUCH;
    event.sliceCandidates = candidates;
    sensor(event, ctx);
    sensor(
      { ...event, signal: { ...event.signal, action: InputAction.END } },
      ctx,
    );
    expect(ctx.getInteraction(InteractionChannel.PRIMARY_HOVER)).toMatchObject({
      pointer: { isTouch: true },
      targets: candidates,
    });
    sensor(
      { ...event, signal: { ...event.signal, action: InputAction.CANCEL } },
      ctx,
    );
    expect(ctx.getInteraction(InteractionChannel.PRIMARY_HOVER)).toBeNull();
  });

  it("dismisses a reading when touching outside the plot", () => {
    const ctx = createMockContext();
    const sensor = DataHoverSensor();
    const event = createMockEvent(InputAction.MOVE, { data: { value: 10 } });
    sensor(event, ctx);
    sensor(
      {
        ...event,
        isWithinPlot: false,
        signal: {
          ...event.signal,
          source: InputSource.TOUCH,
          action: InputAction.START,
        },
      },
      ctx,
    );
    expect(ctx.getInteraction(InteractionChannel.PRIMARY_HOVER)).toBeNull();
  });
});

describe("engine-queued touch cancellation", () => {
  it.each([1, 2])(
    "does not restore a queued reading after cancellation by pointer %i",
    (cancelId) => {
      vi.useFakeTimers();
      const ctx = createMockContext();
      const sensor = DataHoverSensor();
      const actions: InputAction[] = [];
      const engine = new Engine({
        onEvent: (event) => {
          actions.push(event.signal.action);
          sensor(event, ctx);
        },
      });
      engine.updateBounds(new DOMRect(0, 0, 200, 200), {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });
      engine.updateData([
        { x: 50, y: 50, data: { value: 10 }, seriesId: "a", dataIndex: 0 },
      ]);
      const signal = {
        id: 1,
        source: InputSource.TOUCH,
        action: InputAction.START,
        x: 50,
        y: 50,
        timestamp: 0,
        userId: "local",
      };
      try {
        engine.input(signal);
        expect(
          ctx.getInteraction(InteractionChannel.PRIMARY_HOVER),
        ).not.toBeNull();
        engine.input({ ...signal, action: InputAction.MOVE });
        engine.input({ ...signal, id: cancelId, action: InputAction.CANCEL });
        vi.runAllTimers();
        expect(actions).toEqual([InputAction.START, InputAction.CANCEL]);
        expect(ctx.getInteraction(InteractionChannel.PRIMARY_HOVER)).toBeNull();

        engine.input({ ...signal, action: InputAction.START });
        engine.input({ ...signal, action: InputAction.MOVE });
        vi.runAllTimers();
        expect(
          ctx.getInteraction(InteractionChannel.PRIMARY_HOVER),
        ).not.toBeNull();
        expect(actions.slice(-2)).toEqual([
          InputAction.START,
          InputAction.MOVE,
        ]);
      } finally {
        engine.dispose();
        vi.useRealTimers();
      }
    },
  );
});
