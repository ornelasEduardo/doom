/**
 * KeyboardSensor Tests (Engine Architecture)
 */

import { describe, expect, it, vi } from "vitest";

import { EngineEvent, InputAction } from "../../engine";
import { SensorContext } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { KeyboardSensor } from "./KeyboardSensor";

// =============================================================================
// MOCK SETUP
// =============================================================================

const createMockContext = (): SensorContext => {
  const interactions = new Map<string, unknown>();
  const mockData = [
    { x: 0, y: 10, id: "p0" },
    { x: 1, y: 20, id: "p1" },
    { x: 2, y: 30, id: "p2" },
  ];

  return {
    getChartContext: vi.fn(() => ({
      chartStore: {
        getState: () => ({
          data: mockData,
          scales: {
            x: (v: number) => v * 10,
            y: (v: number) => 100 - v,
          },
          config: { x: "x", y: "y" },
          dimensions: {
            margin: { left: 0, top: 0 },
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

const createMockEvent = (action: InputAction, key?: string): EngineEvent => ({
  signal: { action, type: "keyboard", key, source: "keyboard" },
  primaryCandidate: null,
  candidates: [],
  chartX: 0,
  chartY: 0,
  isTouch: false,
});

// =============================================================================
// TESTS
// =============================================================================

describe("KeyboardSensor (Engine)", () => {
  it("should not react to non-KEY actions", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    const event = createMockEvent(InputAction.START);
    sensor(event, ctx);

    expect(ctx.upsertInteraction).not.toHaveBeenCalled();
  });

  it("should focus first point on ArrowRight if no focus", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // 1. ArrowRight
    const event = createMockEvent(InputAction.KEY, "ArrowRight");
    sensor(event, ctx);

    // Initial focus starts at -1, enters at 0
    expect(ctx.upsertInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 0 }),
      }),
    );
  });

  it("should move focus with ArrowRight/ArrowLeft", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // 1. Focus first point
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);

    // 2. Focus next (index 1)
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 1 }),
      }),
    );

    // 3. Focus prev (index 0)
    sensor(createMockEvent(InputAction.KEY, "ArrowLeft"), ctx);

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 0 }),
      }),
    );
  });

  it("should clear interaction on Escape", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // 1. Focus something
    sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);

    // 2. Escape
    sensor(createMockEvent(InputAction.KEY, "Escape"), ctx);

    expect(ctx.removeInteraction).toHaveBeenCalledWith(
      InteractionChannel.PRIMARY_HOVER,
    );
  });

  it("should clamp focus to data bounds", () => {
    const ctx = createMockContext();
    const sensor = KeyboardSensor();

    // Data length is 3 (indices 0, 1, 2)
    // Click ArrowRight 5 times
    for (let i = 0; i < 5; i++) {
      sensor(createMockEvent(InputAction.KEY, "ArrowRight"), ctx);
    }

    expect(ctx.upsertInteraction).toHaveBeenLastCalledWith(
      InteractionChannel.PRIMARY_HOVER,
      expect.objectContaining({
        target: expect.objectContaining({ dataIndex: 2 }),
      }),
    );
  });
});
