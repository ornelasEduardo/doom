import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { DraggablePuck, Markers, SelectionUpdate } from "../behaviors";
import { Engine } from "../engine";
import {
  createChartStore,
  upsertInteraction,
} from "../state/store/chart.store";
import type { ContextValue } from "../types/context";
import type { Behavior } from "../types/events";
import type { DragInteraction, HoverInteraction } from "../types/interaction";
import { d3 } from "../utils/d3";
import {
  createInteractionAccess,
  createInteractionChannel,
} from "../utils/interactionChannels";
import { useChartBehaviors } from "./useChartBehaviors";

afterEach(cleanup);

function fixture() {
  const chartStore = createChartStore({ type: "line" });
  const plot = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chartStore.setState((s) => ({
    status: "ready",
    elements: { ...s.elements, plot },
  }));
  const context: ContextValue = {
    chartStore,
    engine: new Engine(),
    config: { type: "line" },
    isMobile: false,
    colorPalette: [],
    styles: {},
    resolveInteraction: () => null,
  };
  return { chartStore, plot, context };
}

it("preserves each behavior's layer and subscription across add, reorder, remove and series updates", () => {
  const { chartStore, plot, context } = fixture();
  let updates = 0;
  let cleanups = 0;
  const persistent: Behavior = ({ getChartContext }) => {
    const layer = getChartContext().g!.append("g").attr("data-brush", "");
    const unsubscribe = chartStore.subscribe(() => {
      updates++;
    });
    return () => {
      cleanups++;
      unsubscribe();
      layer.remove();
    };
  };
  const extra: Behavior = ({ getChartContext }) => {
    const layer = getChartContext().g!.append("g").attr("data-extra", "");
    return () => {
      layer.remove();
    };
  };
  const view = renderHook(
    ({ behaviors }) => useChartBehaviors(context, behaviors),
    {
      initialProps: { behaviors: [persistent] },
      wrapper: StrictMode,
    },
  );
  const original = plot.querySelector("[data-brush]");
  const baselineCleanups = cleanups;
  view.rerender({ behaviors: [persistent, extra] });
  expect(plot.querySelector("[data-brush]")).toBe(original);
  view.rerender({ behaviors: [extra, persistent] });
  expect(plot.querySelector("[data-brush]")).toBe(original);
  act(() =>
    chartStore.setState({
      processedSeries: [{ id: "added", label: "Added", color: "currentColor" }],
    }),
  );
  view.rerender({ behaviors: [persistent] });
  expect(plot.querySelector("[data-brush]")).toBe(original);
  expect(plot.querySelector("[data-extra]")).toBeNull();
  expect(cleanups).toBe(baselineCleanups);
  const beforeUpdate = updates;
  act(() =>
    upsertInteraction(chartStore, "probe", { selection: [], mode: "discrete" }),
  );
  expect(updates).toBe(beforeUpdate + 1);
  view.unmount();
  expect(plot.children).toHaveLength(0);
  expect(cleanups).toBe(baselineCleanups + 1);
  const afterUnmount = updates;
  upsertInteraction(chartStore, "probe", { selection: [], mode: "continuous" });
  expect(updates).toBe(afterUnmount);
  context.engine.dispose();
});

it("releases layers when unready or the plot is replaced, then attaches once to the current plot", () => {
  const { chartStore, plot, context } = fixture();
  const behavior: Behavior = ({ getChartContext }) => {
    const layer = getChartContext().g!.append("g");
    return () => {
      layer.remove();
    };
  };
  const view = renderHook(() => useChartBehaviors(context, [behavior]));
  expect(plot.children).toHaveLength(1);
  act(() => chartStore.setState({ status: "idle" }));
  expect(plot.children).toHaveLength(0);
  const replacement = plot.cloneNode() as SVGGElement;
  act(() =>
    chartStore.setState((s) => ({
      status: "ready",
      elements: { ...s.elements, plot: replacement },
    })),
  );
  expect(replacement.children).toHaveLength(1);
  view.unmount();
  expect(replacement.children).toHaveLength(0);
  context.engine.dispose();
});

it("hydrates markers from an existing interaction without a subsequent store write", () => {
  const { chartStore, plot, context } = fixture();
  upsertInteraction(chartStore, "pinned", {
    targets: [{ data: 7, coordinate: { x: 50, y: 60 } }],
    pointer: { x: 50, y: 60, containerX: 50, containerY: 60, isTouch: false },
  });
  const markers = Markers({ on: "pinned" });
  const view = renderHook(() => useChartBehaviors(context, [markers]));
  expect(plot.querySelectorAll("circle")).toHaveLength(1);
  view.unmount();
  expect(plot.children).toHaveLength(0);
  context.engine.dispose();
});

it("hydrates SelectionUpdate and passes the selected snapshot to a custom callback", () => {
  const { chartStore, plot, context } = fixture();
  const selected = { value: 4 };
  d3.select(plot).append("circle").datum(selected);
  upsertInteraction(chartStore, "selection", {
    selection: [selected],
    mode: "discrete",
  });
  const behavior = SelectionUpdate({
    selector: "circle",
    fn: (selection, data) => {
      selection.attr(
        "data-selected",
        Array.isArray(data) && data.includes(selected) ? "yes" : "no",
      );
    },
  });
  const view = renderHook(() => useChartBehaviors(context, [behavior]));
  expect(plot.querySelector("circle")?.getAttribute("data-selected")).toBe(
    "yes",
  );
  view.unmount();
  context.engine.dispose();
});

it("continues cleaning sibling resources when a custom cleanup throws", () => {
  const { plot, context } = fixture();
  const error = new Error("broken cleanup");
  const report = vi.spyOn(console, "error").mockImplementation(() => {});
  const broken: Behavior = () => () => {
    throw error;
  };
  const sibling: Behavior = ({ getChartContext }) => {
    const layer = getChartContext().g!.append("rect");
    return () => {
      layer.remove();
    };
  };
  try {
    const view = renderHook(() =>
      useChartBehaviors(context, [broken, sibling]),
    );
    expect(() => view.unmount()).not.toThrow();
    expect(plot.children).toHaveLength(0);
    expect(report).toHaveBeenCalledWith("Chart behavior cleanup failed", error);
  } finally {
    report.mockRestore();
    context.engine.dispose();
  }
});

it("isolates a throwing setup and does not retry it on unrelated renders", () => {
  const { plot, context } = fixture();
  const report = vi.spyOn(console, "error").mockImplementation(() => {});
  let attempts = 0;
  const broken: Behavior = () => {
    attempts++;
    throw new Error("broken setup");
  };
  const sibling: Behavior = ({ getChartContext }) => {
    const layer = getChartContext().g!.append("rect");
    return () => {
      layer.remove();
    };
  };
  try {
    const view = renderHook(() =>
      useChartBehaviors(context, [broken, sibling]),
    );
    expect(plot.children).toHaveLength(1);
    view.rerender();
    expect(attempts).toBe(1);
    view.unmount();
    expect(plot.children).toHaveLength(0);
  } finally {
    report.mockRestore();
    context.engine.dispose();
  }
});

it("passes all hover data and an empty array on clear to SelectionUpdate", () => {
  const { context, chartStore, plot } = fixture();
  const channel = createInteractionChannel<HoverInteraction<unknown>>("hover");
  const access = createInteractionAccess(chartStore);
  const behavior = SelectionUpdate({
    on: channel,
    selector: "circle",
    fn: (selection, data) => {
      selection.attr("data-active", JSON.stringify(data));
    },
  });
  d3.select(plot).append("circle");
  const view = renderHook(() => useChartBehaviors(context, [behavior]));
  expect(plot.querySelector("circle")?.getAttribute("data-active")).toBe("[]");
  act(() =>
    access.upsertInteraction(channel, {
      targets: [1, 2].map((data) => ({ data, coordinate: { x: 10, y: 10 } })),
      pointer: { x: 10, y: 10, containerX: 10, containerY: 10, isTouch: false },
    }),
  );
  expect(plot.querySelector("circle")?.getAttribute("data-active")).toBe(
    "[1,2]",
  );
  act(() => access.removeInteraction(channel));
  expect(plot.querySelector("circle")?.getAttribute("data-active")).toBe("[]");
  view.unmount();
  context.engine.dispose();
});

it("hydrates an owned puck from a typed drag channel and releases its layer", () => {
  const { context, chartStore, plot } = fixture();
  const channel = createInteractionChannel<DragInteraction<unknown>>("drag");
  createInteractionAccess(chartStore).upsertInteraction(channel, {
    target: { data: 4, coordinate: { x: 10, y: 10 } },
    currentPosition: { x: 40, y: 50 },
    startPosition: { x: 10, y: 10 },
    currentValue: { x: 4, y: 5 },
    isDragging: true,
  });
  const behavior = DraggablePuck({ on: channel });
  const view = renderHook(() => useChartBehaviors(context, [behavior]));
  expect(plot.querySelector(".drag-puck")?.getAttribute("cx")).toBe("40");
  view.unmount();
  expect(plot.children).toHaveLength(0);
  context.engine.dispose();
});

it.each([false, true])(
  "releases only its own SelectionUpdate class claims (reverse=%s)",
  (reverse) => {
    const { context, chartStore, plot } = fixture();
    const datum = { value: 4 };
    const circle = d3.select(plot).append("circle").datum(datum).node()!;
    createInteractionAccess(chartStore).upsertInteraction("selection", {
      selection: [datum],
      mode: "discrete",
    });
    const first = SelectionUpdate({ selector: "circle" });
    const second = SelectionUpdate({ selector: "circle" });
    const view = renderHook(
      ({ behaviors }) => useChartBehaviors(context, behaviors),
      { initialProps: { behaviors: [first, second] } },
    );
    expect(circle.classList.contains("selected")).toBe(true);
    view.rerender({ behaviors: [reverse ? first : second] });
    expect(circle.classList.contains("selected")).toBe(true);
    view.unmount();
    expect(circle.classList.contains("selected")).toBe(false);
    context.engine.dispose();
  },
);

it("preserves preexisting classes after SelectionUpdate releases its claims", () => {
  const { context, plot } = fixture();
  const circle = d3
    .select(plot)
    .append("circle")
    .attr("class", "selected dimmed")
    .node()!;
  const behavior = SelectionUpdate({ selector: "circle" });
  const view = renderHook(() => useChartBehaviors(context, [behavior]));
  view.unmount();
  expect(circle.classList.contains("selected")).toBe(true);
  expect(circle.classList.contains("dimmed")).toBe(true);
  context.engine.dispose();
});

it("releases a SelectionUpdate subscription when initial hydration throws", () => {
  const { chartStore, context } = fixture();
  const error = new Error("hydration failed");
  const report = vi.spyOn(console, "error").mockImplementation(() => {});
  let attempts = 0;
  const broken = SelectionUpdate({
    fn: () => {
      attempts++;
      throw error;
    },
  });
  const received: unknown[] = [];
  const sibling: Behavior = ({ subscribeInteraction }) =>
    subscribeInteraction("selection", (value) => received.push(value));
  const access = createInteractionAccess(chartStore);
  const view = renderHook(
    ({ behaviors }) => useChartBehaviors(context, behaviors),
    { initialProps: { behaviors: [broken, sibling] } },
  );
  try {
    expect(report).toHaveBeenCalledWith("Chart behavior setup failed", error);
    view.rerender({ behaviors: [sibling] });
    const selection = { selection: [4], mode: "discrete" as const };
    expect(() =>
      act(() => access.upsertInteraction("selection", selection)),
    ).not.toThrow();
    expect(received).toEqual([selection]);
    view.unmount();
    expect(() => access.removeInteraction("selection")).not.toThrow();
    expect(attempts).toBe(1);
    expect(received).toEqual([selection]);
  } finally {
    view.unmount();
    report.mockRestore();
    context.engine.dispose();
  }
});
