import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createStore } from "./createStore";

describe("createStore", () => {
  it("should initialize with default state", () => {
    const store = createStore({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it("should update state", () => {
    const store = createStore({ count: 0 });
    store.setState({ count: 1 });
    expect(store.getState()).toEqual({ count: 1 });
  });

  it("should update state with function", () => {
    const store = createStore({ count: 0 });
    store.setState((prev) => ({ count: prev.count + 1 }));
    expect(store.getState()).toEqual({ count: 1 });
  });

  it("should notify listeners", () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should work as a hook", () => {
    const store = createStore({ count: 0 });
    const { result } = renderHook(() => store.useStore((s) => s.count));

    expect(result.current).toBe(0);

    act(() => {
      store.setState({ count: 1 });
    });

    expect(result.current).toBe(1);
  });

  it("should only re-render when selector changes", () => {
    const store = createStore({ count: 0, other: "foo" });
    const renderSpy = vi.fn();

    const { result } = renderHook(() => {
      renderSpy();
      return store.useStore((s) => s.count);
    });

    expect(renderSpy).toHaveBeenCalledTimes(1);

    act(() => {
      store.setState({ other: "bar" });
    });

    // Should not re-render because count didn't change
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(0);

    act(() => {
      store.setState({ count: 1 });
    });

    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(1);
  });
});
