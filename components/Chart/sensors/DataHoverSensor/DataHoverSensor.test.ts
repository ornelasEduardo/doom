/**
 * DataHoverSensor Tests (Engine Architecture)
 */

import { describe, expect, it, vi } from "vitest";

import { EngineEvent, InputAction } from "../../engine";
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
  signal: { action, type: "pointer", x: 0, y: 0, source: "mouse" },
  primaryCandidate: candidate || null,
  candidates: candidate ? [candidate] : [],
  chartX: 0,
  chartY: 0,
  isTouch: false,
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
});
