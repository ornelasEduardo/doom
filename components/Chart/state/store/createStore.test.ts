import { act, renderHook } from "@testing-library/react";
import React from "react";
import { renderToString } from "react-dom/server";
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

  it("renders on the server without throwing", () => {
    const store = createStore({ count: 7 });
    const Probe = () =>
      React.createElement(
        "span",
        null,
        store.useStore((s) => s.count),
      );

    // useSyncExternalStore requires a getServerSnapshot for server rendering.
    // Without it React throws "Missing getServerSnapshot", which takes down
    // any SSR page that renders a <Chart>.
    expect(() => renderToString(React.createElement(Probe))).not.toThrow();
    expect(renderToString(React.createElement(Probe))).toContain("7");
  });

  it("supports a selector that derives a new object each call", () => {
    const store = createStore({ a: 1, b: 2, other: "x" });

    // useSyncExternalStore compares snapshots with Object.is. A selector that
    // builds a fresh object every call therefore looks like a new snapshot on
    // every read, and React gives up with "Maximum update depth exceeded".
    const { result } = renderHook(() =>
      store.useStore((s) => ({ a: s.a, b: s.b })),
    );

    expect(result.current).toEqual({ a: 1, b: 2 });

    const first = result.current;
    act(() => {
      store.setState({ other: "y" });
    });

    // Unrelated change: the derived value is equal, so the identity should be
    // preserved rather than forcing a re-render.
    expect(result.current).toBe(first);
  });

  it("does not treat two different Maps as the same snapshot", () => {
    const store = createStore({ items: new Map([["a", 1]]) });
    const { result } = renderHook(() => store.useStore((s) => s.items));

    expect(result.current.get("a")).toBe(1);

    // A Map has no own enumerable keys, so comparing snapshots key-by-key
    // would call any two Maps equal and swallow the update. The interactions
    // channel is stored in a Map, so this would freeze every hover.
    act(() => {
      store.setState({ items: new Map([["a", 2]]) });
    });

    expect(result.current.get("a")).toBe(2);
  });
});
