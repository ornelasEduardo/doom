import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";

import { createChartStore } from "../state/store/chart.store";
import type { ContextValue } from "../types/context";
import type { Behavior, BehaviorContext } from "../types/events";
import { useChartBehaviors } from "./useChartBehaviors";
import { useEngine } from "./useEngine";

it("gives an active behavior live configuration without resetting its closure", () => {
  const chartStore = createChartStore({ type: "line" });
  const plot = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chartStore.setState((state) => ({
    status: "ready",
    elements: { ...state.elements, plot },
  }));
  let read!: () => {
    context: ReturnType<BehaviorContext["getChartContext"]>;
    count: number;
  };
  let setups = 0;
  let cleanups = 0;
  const behavior: Behavior = (context) => {
    setups++;
    let count = 0;
    read = () => ({ context: context.getChartContext(), count: ++count });
    return () => {
      cleanups++;
    };
  };
  const { rerender, unmount } = renderHook(
    ({ label, isMobile }) => {
      const { engine } = useEngine();
      const context: ContextValue = {
        chartStore,
        engine,
        config: { type: "line", yAxisLabel: label },
        isMobile,
        colorPalette: [label],
        styles: {},
        resolveInteraction: () => null,
      };
      useChartBehaviors(context, [behavior]);
    },
    { initialProps: { label: "Before", isMobile: false } },
  );
  const initialRead = read;
  expect(read().count).toBe(1);
  rerender({ label: "After", isMobile: true });
  const next = read();
  expect(next.context.config.yAxisLabel).toBe("After");
  expect(next.context.isMobile).toBe(true);
  expect(next.context.colorPalette).toEqual(["After"]);
  expect(next.context.g?.node()).toBe(plot);
  expect(read).toBe(initialRead);
  expect(next.count).toBe(2);
  expect(setups).toBe(1);
  expect(cleanups).toBe(0);
  act(() => unmount());
  expect(cleanups).toBe(1);
});
