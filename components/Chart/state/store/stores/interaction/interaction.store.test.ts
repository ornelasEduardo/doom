import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ChartContextModule from "../../../../context";
import { InteractionType } from "../../../../types/interaction";
import {
  createInteractionStore,
  getInteraction,
  InteractionStore,
  removeInteraction,
  upsertInteraction,
  useInteraction,
} from "./interaction.store";

const useChartContextMock = vi.fn();
vi.spyOn(ChartContextModule, "useChartContext").mockImplementation(
  useChartContextMock,
);

describe("to interaction.store", () => {
  let store: InteractionStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createInteractionStore();
  });

  describe("Store Actions", () => {
    it("upsertInteraction adds a new interaction", () => {
      const payload = { x: 10, y: 20 };
      upsertInteraction(store, InteractionType.HOVER, payload);

      expect(store.getState().interactions.has(InteractionType.HOVER)).toBe(
        true,
      );
      expect(store.getState().interactions.get(InteractionType.HOVER)).toEqual(
        payload,
      );
    });

    it("upsertInteraction updates an existing interaction", () => {
      const payload1 = { x: 10 };
      const payload2 = { x: 20 };
      upsertInteraction(store, InteractionType.HOVER, payload1);
      upsertInteraction(store, InteractionType.HOVER, payload2);

      expect(store.getState().interactions.get(InteractionType.HOVER)).toEqual(
        payload2,
      );
    });

    it("removeInteraction removes an interaction", () => {
      upsertInteraction(store, InteractionType.HOVER, { x: 1 });
      removeInteraction(store, InteractionType.HOVER);

      expect(store.getState().interactions.has(InteractionType.HOVER)).toBe(
        false,
      );
    });

    it("removeInteraction is no-op if key does not exist", () => {
      const initialState = store.getState();
      removeInteraction(store, InteractionType.SELECTION);
      // strict equality to ensure state reference didn't change
      expect(store.getState()).toBe(initialState);
    });

    it("getInteraction retrieves the current value", () => {
      const payload = { data: "test" };
      upsertInteraction(store, "custom-key", payload);
      expect(getInteraction(store, "custom-key")).toEqual(payload);
    });
  });

  describe("useInteraction Hook", () => {
    beforeEach(() => {
      // Mock context to return our test store
      useChartContextMock.mockReturnValue({
        interactionStore: store,
      });
    });

    it("returns interaction state", () => {
      const payload = { id: 1 };
      upsertInteraction(store, InteractionType.HOVER, payload);

      const { result } = renderHook(() =>
        useInteraction(InteractionType.HOVER),
      );
      expect(result.current).toEqual(payload);
    });

    it("updates when store updates", () => {
      const { result } = renderHook(() =>
        useInteraction(InteractionType.HOVER),
      );
      expect(result.current).toBeNull();

      act(() => {
        upsertInteraction(store, InteractionType.HOVER, { val: 1 });
      });

      expect(result.current).toEqual({ val: 1 });
    });

    it("supports selectors", () => {
      const payload = { pointer: { x: 10 }, target: { data: "a" } };
      upsertInteraction(store, InteractionType.HOVER, payload);

      const { result } = renderHook(() =>
        useInteraction(
          InteractionType.HOVER,
          (state: any) => state?.pointer?.x,
        ),
      );

      expect(result.current).toBe(10);
    });
  });
});
