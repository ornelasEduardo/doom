/**
 * SelectionSensor Tests (Engine Architecture)
 */

import { describe, expect, it, vi } from "vitest";

import { EngineEvent, InputAction } from "../../engine";
import { SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { SelectionSensor } from "./SelectionSensor";

// =============================================================================
// MOCK SETUP
// =============================================================================

const createMockContext = (): SensorContext => {
  const interactions = new Map<string, unknown>();
  const mockData = [
    { x: 0, y: 100, id: "point-0" },
    { x: 1, y: 200, id: "point-1" },
    { x: 2, y: 150, id: "point-2" },
  ];

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
  signal: { action, type: "pointer", x: 0, y: 0, source: "mouse" },
  primaryCandidate: candidate || null,
  candidates: candidate ? [candidate] : [],
  chartX: 0,
  chartY: 0,
  isTouch: false,
});

// =============================================================================
// TESTS
// =============================================================================

describe("SelectionSensor (Engine)", () => {
  it("should select a data point on START action", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();
    const dataPoint = { x: 0, y: 100, id: "point-0" };

    const event = createMockEvent(InputAction.START, {
      data: dataPoint,
      seriesId: "test",
      distance: 0,
    });

    sensor(event, ctx);

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.SELECTION,
      expect.objectContaining({
        selection: [dataPoint],
        mode: "discrete",
      }),
    );
  });

  it("should ignore non-START actions", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();
    const dataPoint = { x: 0, y: 100 };

    const event = createMockEvent(InputAction.MOVE, {
      data: dataPoint,
    });

    sensor(event, ctx);
    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should ignore events without primaryCandidate", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();

    const event = createMockEvent(InputAction.START, null);

    sensor(event, ctx);
    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should toggle selection (deselect if already selected)", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor();
    const dataPoint = { x: 0, y: 100, id: "point-0" };

    // Pre-seed selection
    ctx.upsertInteraction(InteractionChannel.SELECTION, {
      selection: [dataPoint],
    });

    const event = createMockEvent(InputAction.START, {
      data: dataPoint,
    });

    sensor(event, ctx);

    // Expect empty selection
    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.SELECTION,
      expect.objectContaining({
        selection: [],
      }),
    );
  });

  it("should use custom interaction name", () => {
    const ctx = createMockContext();
    const sensor = SelectionSensor({ name: "my-selection" });
    const dataPoint = { id: "A" };

    const event = createMockEvent(InputAction.START, {
      data: dataPoint,
    });

    sensor(event, ctx);

    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      "my-selection",
      expect.anything(),
    );
  });
});
