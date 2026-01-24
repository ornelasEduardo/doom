import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ChartContext, ChartContextValue } from "../../../../context";
import {
  createSeriesStore,
  registerSeries,
  SeriesStore,
  unregisterSeries,
  useSeries,
} from "./series.store";

describe("seriesStore", () => {
  let store: SeriesStore;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    store = createSeriesStore();
    wrapper = ({ children }) => (
      <ChartContext.Provider
        value={
          {
            seriesStore: store,
          } as unknown as ChartContextValue<unknown>
        }
      >
        {children}
      </ChartContext.Provider>
    );
  });

  it("registers and unregisters series", () => {
    const id = "test-series";
    const items = [{ label: "Test", color: "red" }];

    registerSeries(store, id, items);

    // registration hydrates items, so direct reference equality check fails on array content
    const registered = store.getState().series.get(id);
    expect(registered).toHaveLength(1);
    expect(registered?.[0].label).toBe("Test");
    expect(registered?.[0].color).toBe("red");
    expect(registered?.[0].id).toBeDefined();

    unregisterSeries(store, id);
    expect(store.getState().series.has(id)).toBe(false);
  });

  it("useSeries derives processed series correctly", () => {
    const { result } = renderHook(() => useSeries(), { wrapper });

    expect(result.current).toEqual([]);

    act(() => {
      registerSeries(store, "s1", [{ label: "A" }]);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].label).toBe("A");
    expect(result.current[0].color).toBeDefined();

    act(() => {
      registerSeries(store, "s2", [{ label: "B", color: "blue" }]);
    });

    expect(result.current).toHaveLength(2);
    expect(result.current[1].label).toBe("B");
    expect(result.current[1].color).toBe("blue");
  });
});
