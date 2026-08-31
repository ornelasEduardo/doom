import { act, render, screen, waitFor } from "@testing-library/react";
import React, { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { Chart } from "./Chart";
import { Engine } from "./engine/Engine";
import {
  type Behavior,
  InputAction,
  InteractionChannel,
  type Sensor,
} from "./index";
import {
  leavePointer,
  movePointer,
  type StubbedGeometry,
  stubChartGeometry,
} from "./tests/chart-test-utils";

class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {
    this.callback(
      [
        {
          contentRect: { width: 500, height: 300 },
        } as ResizeObserverEntry,
      ],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.useFakeTimers();
  global.ResizeObserver = MockResizeObserver;

  SVGSVGElement.prototype.createSVGPoint = function () {
    return {
      x: 0,
      y: 0,
      matrixTransform: function (_m: any) {
        return this;
      },
    } as DOMPoint;
  };

  SVGGraphicsElement.prototype.getScreenCTM = function () {
    return {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
      inverse: function () {
        return this;
      },
    } as DOMMatrix;
  };

  if (!global.PointerEvent) {
    class MockPointerEvent extends MouseEvent {
      pointerId: number;
      pointerType: string;
      isPrimary: boolean;
      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
        this.pointerId = params.pointerId || 0;
        this.pointerType = params.pointerType || "mouse";
        this.isPrimary = params.isPrimary || false;
      }
    }
    (global as any).PointerEvent = MockPointerEvent;
  }

  if (!document.elementsFromPoint) {
    document.elementsFromPoint = function (x: number, y: number) {
      const el = document.elementFromPoint(x, y);
      return el ? [el] : [];
    } as any;
  }
});

afterAll(() => {
  vi.useRealTimers();
});

describe("Chart", () => {
  const data = [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
  ];
  const x = (d: any) => d.label;
  const y = (d: any) => d.value;

  it("renders without crashing", () => {
    const { container } = render(<Chart data={data} x={x} y={y} />);

    act(() => {
      vi.runAllTimers();
    });

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(container.querySelector("path")).toBeInTheDocument();
  });

  it("renders on the server without throwing", () => {
    // Chart is a "use client" component, but that still server-renders under
    // the App Router. Any hook that cannot produce a server snapshot takes the
    // whole page down rather than degrading to client-only.
    const html = renderToString(<Chart data={data} x={x} y={y} />);
    expect(html.length).toBeGreaterThan(0);
  });

  it("renders bars for bar chart (using paths)", () => {
    const { container } = render(<Chart data={data} type="bar" x={x} y={y} />);

    act(() => {
      vi.runAllTimers();
    });

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
  });

  it("omits the axes when showAxes is false", () => {
    const { container: shown } = render(<Chart data={data} x={x} y={y} />);
    act(() => {
      vi.runAllTimers();
    });
    expect(shown.querySelector('[aria-label="X Axis"]')).toBeInTheDocument();

    const { container: hidden } = render(
      <Chart d3Config={{ showAxes: false }} data={data} x={x} y={y} />,
    );
    act(() => {
      vi.runAllTimers();
    });
    expect(
      hidden.querySelector('[aria-label="X Axis"]'),
    ).not.toBeInTheDocument();
  });

  it("re-derives the scales when the x accessor prop changes", () => {
    const rows = [
      { month: "Jan", quarter: "Q1", value: 10 },
      { month: "Feb", quarter: "Q2", value: 20 },
    ];

    const { container, rerender } = render(
      <Chart data={rows} x={(d: any) => d.month} y={(d: any) => d.value} />,
    );
    act(() => {
      vi.runAllTimers();
    });
    expect(container.textContent).toContain("Jan");

    // Point the chart at a different field. The store is built in a useState
    // lazy initialiser, so without a sync the accessors stay frozen at their
    // mount-time values and this silently renders the old field forever.
    rerender(
      <Chart data={rows} x={(d: any) => d.quarter} y={(d: any) => d.value} />,
    );
    act(() => {
      vi.runAllTimers();
    });

    expect(container.textContent).toContain("Q1");
    expect(container.textContent).not.toContain("Jan");
  });

  it("does not re-derive the scales when an equivalent accessor is re-created", () => {
    const rows = [
      { month: "Jan", quarter: "Q1", value: 10 },
      { month: "Feb", quarter: "Q2", value: 20 },
    ];
    const scales: any[] = [];
    const capture = (ctx: any) => scales.push(ctx.scales.x);

    const { rerender } = render(
      <Chart
        data={rows}
        render={capture}
        x={(d: any) => d.month}
        y={(d: any) => d.value}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });
    const beforeRerender = scales[scales.length - 1];

    // A brand-new arrow with identical behaviour. If the sync effect keyed off
    // identity it would rebuild the scales here — and, because that write
    // re-renders subscribers, keep doing so forever.
    rerender(
      <Chart
        data={rows}
        render={capture}
        x={(d: any) => d.month}
        y={(d: any) => d.value}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });

    expect(scales[scales.length - 1]).toBe(beforeRerender);

    // A genuinely different accessor must still rebuild them.
    rerender(
      <Chart
        data={rows}
        render={capture}
        x={(d: any) => d.quarter}
        y={(d: any) => d.value}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });

    expect(scales[scales.length - 1]).not.toBe(beforeRerender);
  });

  describe("layering", () => {
    it("places the tooltip on the system tooltip layer", () => {
      const geometry = stubChartGeometry({ left: 0, top: 0 });
      try {
        const { container } = render(<Chart data={data} x={x} y={y} />);
        act(() => {
          vi.runAllTimers();
        });
        const root = container.querySelector(
          "[data-chart-container]",
        ) as HTMLElement;
        geometry.attach(root);

        movePointer(root, 60, 150, { pointerType: "mouse" });

        // A hardcoded 10 is --z-elevated, 490 levels below where the system
        // puts tooltips, so the chart tooltip renders under dropdowns, modals
        // and drawers.
        const tooltip = container.querySelector(
          "[data-chart-tooltip]",
        ) as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.style.zIndex).toBe("var(--z-tooltip)");
      } finally {
        geometry.restore();
      }
    });
  });

  describe("mark accessible names", () => {
    it("names data points by their values, not by dumping the raw datum", () => {
      const rows = [
        { label: "Jan", value: 10, internalId: "row-1", _meta: { secret: 1 } },
        { label: "Feb", value: 20, internalId: "row-2", _meta: { secret: 2 } },
      ];

      const { container } = render(
        <Chart
          d3Config={{ showDots: true }}
          data={rows}
          type="line"
          x="label"
          y="value"
        />,
      );
      act(() => {
        vi.runAllTimers();
      });

      const labelled = Array.from(
        container.querySelectorAll('[aria-roledescription="data point"]'),
      ).map((el) => el.getAttribute("aria-label") ?? "");

      expect(labelled.length).toBeGreaterThan(0);

      // JSON.stringify(datum) reads the whole row aloud, including fields the
      // consumer never intended to expose.
      for (const name of labelled) {
        expect(name).not.toContain("{");
        expect(name).not.toContain("internalId");
      }
      expect(labelled.join(" ")).toContain("Jan");
      expect(labelled.join(" ")).toContain("10");
    });
  });

  describe("hover marker constancy", () => {
    it("reuses the marker element across frames on the same point", () => {
      const geometry = stubChartGeometry({ left: 0, top: 0 });
      try {
        const { container } = render(
          <Chart data={data} type="line" x={x} y={y} />,
        );
        act(() => {
          vi.runAllTimers();
        });
        const root = container.querySelector(
          "[data-chart-container]",
        ) as HTMLElement;
        geometry.attach(root);

        movePointer(root, 60, 150, { pointerType: "mouse" });
        const first = container.querySelector("circle");
        expect(first).toBeTruthy();

        movePointer(root, 61, 151, { pointerType: "mouse" });
        const second = container.querySelector("circle");

        // Keying the d3 join on Math.random() makes every datum look new, so
        // the marker is torn down and re-appended on every frame — no object
        // constancy, and any transition restarts each time.
        expect(second).toBe(first);
      } finally {
        geometry.restore();
      }
    });
  });

  describe("axis ticks", () => {
    it("caps tick labels on a categorical x-axis", () => {
      const many = Array.from({ length: 30 }, (_, i) => ({
        label: `Category ${i}`,
        value: i,
      }));

      const { container } = render(<Chart data={many} x={x} y={y} />);
      act(() => {
        vi.runAllTimers();
      });

      // d3's axis.ticks() is a no-op on band/point scales, so every category
      // rendered a label — 30 overlapping strings across the axis.
      const xLabels = container.querySelectorAll(
        '[aria-label="X Axis"] .tick text',
      );
      expect(xLabels.length).toBeGreaterThan(0);
      expect(xLabels.length).toBeLessThanOrEqual(8);
    });

    it("keeps the grid and the y-axis on the same tick budget", () => {
      // The axis thins to three ticks on a narrow viewport while the grid was
      // hardcoded to five, so the grid drew lines with no matching axis label.
      const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation(
        (query: string) =>
          ({
            matches: true,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            onchange: null,
            dispatchEvent: vi.fn(),
          }) as unknown as MediaQueryList,
      );

      try {
        const { container } = render(
          <Chart d3Config={{ grid: true }} data={data} x={x} y={y} />,
        );
        act(() => {
          vi.runAllTimers();
        });

        const gridLines = container.querySelectorAll("[data-chart-grid] line");
        const axisTicks = container.querySelectorAll(
          '[aria-label="Y Axis"] .tick',
        );

        expect(axisTicks.length).toBeGreaterThan(0);
        expect(gridLines.length).toBe(axisTicks.length);
      } finally {
        matchMedia.mockRestore();
      }
    });
  });

  describe("document structure", () => {
    it("does not inject headings into the page outline while hovering", () => {
      const geometry = stubChartGeometry({ left: 0, top: 0 });
      try {
        const { container } = render(<Chart data={data} x={x} y={y} />);
        act(() => {
          vi.runAllTimers();
        });
        const root = container.querySelector(
          "[data-chart-container]",
        ) as HTMLElement;
        geometry.attach(root);

        movePointer(root, 60, 150, { pointerType: "mouse" });

        const tooltip = container.querySelector("[data-chart-tooltip]");
        expect(tooltip?.textContent).toContain("A");

        // A tooltip is transient annotation, not a document section. Emitting
        // real <h4>/<h6> puts a new entry in the screen reader's heading
        // outline on every hover.
        expect(tooltip!.querySelectorAll("h1,h2,h3,h4,h5,h6")).toHaveLength(0);
      } finally {
        geometry.restore();
      }
    });
  });

  describe("stale interaction state", () => {
    it("clears a hover when the data changes underneath it", () => {
      const before = [
        { label: "A", value: 10 },
        { label: "B", value: 20 },
      ];
      const after = [
        { label: "X", value: 11 },
        { label: "Y", value: 21 },
      ];
      const geometry = stubChartGeometry({ left: 0, top: 0 });

      try {
        const { container, rerender } = render(
          <Chart data={before} x={x} y={y} />,
        );
        act(() => {
          vi.runAllTimers();
        });
        const root = container.querySelector(
          "[data-chart-container]",
        ) as HTMLElement;
        geometry.attach(root);

        const tooltipText = () =>
          container.querySelector("[data-chart-tooltip]")?.textContent ?? "";

        movePointer(root, 60, 150, { pointerType: "mouse" });
        expect(tooltipText()).toContain("A");

        // The pointer has not moved, but the datum it was pointing at is gone.
        // Nothing invalidates the interactions map, so the tooltip, markers and
        // onValueChange keep reporting a row that no longer exists.
        rerender(<Chart data={after} x={x} y={y} />);
        act(() => {
          vi.runAllTimers();
        });

        expect(tooltipText()).not.toContain("A");
      } finally {
        geometry.restore();
      }
    });
  });

  describe("per-frame cost", () => {
    it("does not rebuild the spatial index on every pointer move", () => {
      const geometry = stubChartGeometry({ left: 0, top: 0 });
      try {
        const { container } = render(<Chart data={data} x={x} y={y} />);
        act(() => {
          vi.runAllTimers();
        });
        const root = container.querySelector(
          "[data-chart-container]",
        ) as HTMLElement;
        geometry.attach(root);

        // Spy only after the chart has settled, so this counts rebuilds
        // caused by interaction rather than by mounting.
        const updateData = vi.spyOn(Engine.prototype, "updateData");
        const setContainer = vi.spyOn(Engine.prototype, "setContainer");

        for (let i = 0; i < 5; i += 1) {
          movePointer(root, 60 + i, 150, { pointerType: "mouse" });
        }

        // Hovering writes an interaction, which notifies the store. Rebuilding
        // the quadtree and re-reading layout from that notification makes every
        // hover frame O(n) in the data plus two forced layouts.
        expect(updateData).not.toHaveBeenCalled();
        expect(setContainer).not.toHaveBeenCalled();

        updateData.mockRestore();
        setContainer.mockRestore();
      } finally {
        geometry.restore();
      }
    });
  });

  describe("documented examples", () => {
    it("renders the composition example from chart.md", () => {
      // Kept in step with skills/doom-design-system/components/chart.md. The
      // previously documented form passed `type`/`color` to Chart.Plot, which
      // accepts neither, and rendered an empty plot.
      const rows = [
        { label: "Jan", value: 10 },
        { label: "Feb", value: 20 },
      ];

      const { container } = render(
        <Chart.Root
          d3Config={{ grid: true }}
          data={rows}
          type="line"
          x="label"
          y="value"
        >
          <Chart.Header subtitle="Last 12 months" title="Sales">
            <Chart.Legend />
          </Chart.Header>
          <Chart.Plot>
            <Chart.Grid />
            <Chart.Cursor />
            <Chart.Series type="area" x="label" y="value" />
            <Chart.Axis />
          </Chart.Plot>
          <Chart.Footer>Custom footer content</Chart.Footer>
        </Chart.Root>,
      );
      act(() => {
        vi.runAllTimers();
      });

      expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
      expect(container.querySelector("[data-chart-grid]")).toBeInTheDocument();
      expect(
        container.querySelector('[aria-label="X Axis"]'),
      ).toBeInTheDocument();
      expect(container.textContent).toContain("Sales");
      expect(container.textContent).toContain("Custom footer content");
    });
  });

  describe("extension API", () => {
    it("keeps stable behaviors attached across re-renders", () => {
      const attach = vi.fn();
      const detach = vi.fn();
      const behavior: Behavior = () => {
        attach();
        return () => detach();
      };

      const { rerender } = render(
        <Chart behaviors={[behavior]} data={data} x={x} y={y} />,
      );
      act(() => {
        vi.runAllTimers();
      });

      const attachedOnce = attach.mock.calls.length;
      expect(attachedOnce).toBeGreaterThan(0);

      // Same behavior, fresh array literal. Keying off array identity tears
      // down and re-appends every d3 layer on any unrelated parent render.
      rerender(<Chart behaviors={[behavior]} data={data} x={x} y={y} />);
      act(() => {
        vi.runAllTimers();
      });

      expect(detach).not.toHaveBeenCalled();
      expect(attach.mock.calls.length).toBe(attachedOnce);
    });

    it("keeps stable sensors registered across re-renders", () => {
      const sensor: Sensor = vi.fn();

      const { rerender } = render(
        <Chart data={data} sensors={[sensor]} x={x} y={y} />,
      );
      act(() => {
        vi.runAllTimers();
      });

      const setHandler = vi.spyOn(Engine.prototype, "setHandler");

      // Same sensor, fresh array literal — the ordinary way a consumer writes
      // this. Keying off array identity tears down and re-registers the whole
      // sensor set on every parent render, discarding any closure state a
      // stateful sensor such as DragSensor is holding mid-gesture.
      rerender(<Chart data={data} sensors={[sensor]} x={x} y={y} />);
      act(() => {
        vi.runAllTimers();
      });

      expect(setHandler).not.toHaveBeenCalled();
      setHandler.mockRestore();
    });

    it("drives a custom sensor through the real event pipeline", () => {
      const seen: Array<{ action: string; label?: string }> = [];

      const RecordingSensor: Sensor = (event, ctx) => {
        seen.push({
          action: String(event.signal.action),
          label: (event.primaryCandidate?.data as any)?.label,
        });
        if (
          event.signal.action === InputAction.MOVE &&
          event.primaryCandidate
        ) {
          ctx.upsertInteraction(InteractionChannel.PRIMARY_HOVER, {
            targets: [event.primaryCandidate],
          } as any);
        }
      };

      const geometry = stubChartGeometry({ left: 0, top: 0 });
      try {
        const { container } = render(
          <Chart data={data} sensors={[RecordingSensor]} x={x} y={y} />,
        );
        act(() => {
          vi.runAllTimers();
        });
        const root = container.querySelector(
          "[data-chart-container]",
        ) as HTMLElement;
        geometry.attach(root);

        movePointer(root, 60, 150, { pointerType: "mouse" });

        // A consumer-supplied sensor must receive real EngineEvents with
        // resolved hit-test candidates — that is the whole extension contract.
        expect(seen.length).toBeGreaterThan(0);
        expect(seen.some((e) => e.label === "A")).toBe(true);
      } finally {
        geometry.restore();
      }
    });
  });

  describe("composition API", () => {
    it("hit-tests against a series' own data, not the root data", () => {
      const rootData = [
        { label: "A", value: 10 },
        { label: "B", value: 20 },
      ];
      // Inside the root-derived domain: scales are still computed from the
      // root data, so a series whose values sit outside it renders off-plot.
      const seriesData = [
        { label: "A", value: 12 },
        { label: "B", value: 18 },
      ];
      const onValueChange = vi.fn();
      const geometry = stubChartGeometry({ left: 0, top: 0 });

      try {
        const { container } = render(
          <Chart.Root
            data={rootData}
            x="label"
            y="value"
            onValueChange={onValueChange}
          >
            <Chart.Plot>
              <Chart.Series data={seriesData} type="line" x="label" y="value" />
            </Chart.Plot>
          </Chart.Root>,
        );
        act(() => {
          vi.runAllTimers();
        });
        const root = container.querySelector(
          "[data-chart-container]",
        ) as HTMLElement;
        geometry.attach(root);

        movePointer(root, 60, 150, { pointerType: "mouse" });

        // The line is drawn from seriesData, so hit-testing must resolve
        // against it too. Registering the series without its data makes the
        // rendered geometry and the reported datum disagree.
        expect(onValueChange).toHaveBeenCalledWith(
          expect.objectContaining({ value: 12 }),
        );
      } finally {
        geometry.restore();
      }
    });

    it("gives sibling series distinct colors when none are specified", () => {
      const rows = [
        { m: "A", r: 10, e: 5 },
        { m: "B", r: 20, e: 8 },
      ];

      const { container } = render(
        <Chart.Root data={rows} type="line" x="m" y="r">
          <Chart.Plot>
            <Chart.Series label="Revenue" type="line" x="m" y="r" />
            <Chart.Series label="Expenses" type="line" x="m" y="e" />
          </Chart.Plot>
        </Chart.Root>,
      );
      act(() => {
        vi.runAllTimers();
      });

      const strokes = Array.from(container.querySelectorAll("path"))
        .map((p) => (p as SVGElement).style.stroke)
        .filter(Boolean);

      expect(strokes.length).toBeGreaterThanOrEqual(2);
      expect(new Set(strokes).size).toBeGreaterThan(1);
    });
  });

  describe("assistive technology", () => {
    function chartRegion(container: HTMLElement) {
      return container.querySelector("[data-chart-container]") as HTMLElement;
    }

    function describedText(container: HTMLElement) {
      const ids = chartRegion(container).getAttribute("aria-describedby");
      if (!ids) {
        return null;
      }
      return ids
        .split(/\s+/)
        .map((id) => container.querySelector(`[id="${id}"]`))
        .filter(Boolean)
        .map((el) => el!.textContent)
        .join(" ");
    }

    it("describes the chart with a summary of its data", () => {
      const { container } = render(
        <Chart data={data} title="Revenue" x={x} y={y} />,
      );
      act(() => {
        vi.runAllTimers();
      });

      // The only accessible name was "Chart: Revenue" and the SVG is
      // aria-hidden, so nothing conveyed what the chart actually contains.
      const text = describedText(container);
      expect(text).toBeTruthy();
      expect(text).toMatch(/2 data points/i);
      expect(text).toMatch(/10/);
      expect(text).toMatch(/20/);
    });

    it("points aria-describedby at elements that exist", () => {
      const { container } = render(
        <Chart data={data} subtitle="Monthly" title="Revenue" x={x} y={y} />,
      );
      act(() => {
        vi.runAllTimers();
      });

      const ids = chartRegion(container)
        .getAttribute("aria-describedby")!
        .split(/\s+/);

      for (const id of ids) {
        expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
      }
    });

    it("announces the active value in a live region", () => {
      const geometry = stubChartGeometry({ left: 0, top: 0 });
      try {
        const { container } = render(<Chart data={data} x={x} y={y} />);
        act(() => {
          vi.runAllTimers();
        });
        const root = chartRegion(container);
        geometry.attach(root);

        const live = container.querySelector('[aria-live="polite"]');
        expect(live).toBeInTheDocument();

        movePointer(root, 60, 150, { pointerType: "mouse" });

        expect(live!.textContent).toContain("A");
      } finally {
        geometry.restore();
      }
    });

    it("gives each chart instance its own aria ids", () => {
      const first = render(
        <Chart data={data} subtitle="One" title="One" x={x} y={y} />,
      );
      const second = render(
        <Chart data={data} subtitle="Two" title="Two" x={x} y={y} />,
      );
      act(() => {
        vi.runAllTimers();
      });

      const idsOf = (c: HTMLElement) =>
        Array.from(c.querySelectorAll("[id]")).map((el) => el.id);

      const a = idsOf(first.container);
      const b = idsOf(second.container);
      expect(a.length).toBeGreaterThan(0);
      expect(a.filter((id) => b.includes(id))).toEqual([]);
    });
  });

  it("renders a custom visualization via render prop", () => {
    const renderSpy = vi.fn();
    render(<Chart data={data} render={renderSpy} x={x} y={y} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(renderSpy).toHaveBeenCalled();
    const ctx = renderSpy.mock.calls[0][0];

    expect(ctx).toHaveProperty("container");
    expect(ctx.scales).toHaveProperty("x");
    expect(ctx.scales).toHaveProperty("y");
    expect(ctx.resolveInteraction).toBeDefined();
  });

  it("renders axes labels when configured", () => {
    const { getByText } = render(
      <Chart
        d3Config={{ xAxisLabel: "Time", yAxisLabel: "Value" }}
        data={data}
        x={x}
        y={y}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });

    expect(getByText("Time")).toBeInTheDocument();
    expect(getByText("Value")).toBeInTheDocument();
  });

  it.skip("shows tooltip on mouse interaction", async () => {
    const { container } = render(<Chart data={data} x={x} y={y} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(container.querySelector("svg")).toBeInTheDocument();

    const root = container.firstChild as HTMLElement;
    const svg = container.querySelector("svg") as SVGSVGElement;
    const wrapper = svg?.parentElement as HTMLElement;

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      bottom: 300,
      right: 500,
      toJSON: () => {},
    } as DOMRect);

    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      bottom: 300,
      right: 500,
      toJSON: () => {},
    } as DOMRect);

    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      bottom: 300,
      right: 500,
      toJSON: () => {},
    } as DOMRect);

    const innerPlot = container.querySelector("[data-chart-inner-plot]");
    if (innerPlot) {
      vi.spyOn(innerPlot, "getBoundingClientRect").mockReturnValue({
        left: 70,
        top: 40,
        width: 410,
        height: 210,
        x: 70,
        y: 40,
        bottom: 250,
        right: 480,
        toJSON: () => {},
      } as DOMRect);
    }

    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      const style = {
        getPropertyValue: (prop: string) => {
          if (el === root) {
            if (prop === "border-left-width") {
              return "0px";
            }
            if (prop === "border-top-width") {
              return "0px";
            }
          }
          return "";
        },
      };
      return style as unknown as CSSStyleDeclaration;
    });

    // Use Point A coordinates: 20, 150
    // scalePoint padding 0 -> A at 0.
    // Margin left 20 -> Screen X = 20.
    movePointer(root, 20, 150, { pointerType: "mouse" });

    await waitFor(
      () => {
        expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );

    leavePointer(root, { pointerType: "mouse" });
  });

  it.skip("shows tooltip on touch interaction", async () => {
    const { container } = render(<Chart data={data} x={x} y={y} />);

    act(() => {
      vi.runAllTimers();
    });

    const root = container.firstChild as HTMLElement;
    const svg = container.querySelector("svg") as SVGSVGElement;
    const wrapper = svg?.parentElement as HTMLElement;
    const innerPlot = container.querySelector("[data-chart-inner-plot]");

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      bottom: 300,
      right: 500,
      toJSON: () => {},
    } as DOMRect);

    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      bottom: 300,
      right: 500,
      toJSON: () => {},
    } as DOMRect);

    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      bottom: 300,
      right: 500,
      toJSON: () => {},
    } as DOMRect);

    if (innerPlot) {
      vi.spyOn(innerPlot, "getBoundingClientRect").mockReturnValue({
        left: 70,
        top: 40,
        width: 430,
        height: 210,
        x: 70,
        y: 40,
        bottom: 250,
        right: 480,
        toJSON: () => {},
      } as DOMRect);
    }

    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      const style = {
        getPropertyValue: (prop: string) => {
          if (el === root) {
            if (prop === "border-left-width") {
              return "0px";
            }
            if (prop === "border-top-width") {
              return "0px";
            }
          }
          return "";
        },
      };
      return style as unknown as CSSStyleDeclaration;
    });

    movePointer(root, 50, 150, { pointerType: "touch", isPrimary: true });

    await waitFor(() => {
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    });
  });

  it("correctly resolves element data and ignores background", () => {
    let capturedCtx: any;
    render(
      <Chart
        data={data}
        render={(ctx) => {
          capturedCtx = ctx;
        }}
        x={x}
        y={y}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });

    expect(capturedCtx).toBeDefined();

    const mockElement = document.createElement("div");
    (mockElement as any).__data__ = data[0];

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => mockElement);

    const result = capturedCtx.resolveInteraction({
      type: "touchmove",
      touches: [{ clientX: 10, clientY: 10 }],
      preventDefault: vi.fn(),
      cancelable: true,
    });

    expect(result).not.toBeNull();
    expect(result.element).toBe(mockElement);
    expect(result.data).toBe(data[0]);

    (mockElement as any).__data__ = data;
    const badResult = capturedCtx.resolveInteraction({
      type: "touchmove",
      touches: [{ clientX: 10, clientY: 10 }],
      preventDefault: vi.fn(),
      cancelable: true,
    });

    expect(badResult).toBeNull();

    document.elementFromPoint = originalElementFromPoint;
  });

  it("renders area chart with fill path", () => {
    const { container } = render(<Chart data={data} type="area" x={x} y={y} />);
    act(() => {
      vi.runAllTimers();
    });
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it("renders area chart with gradient when configured", () => {
    const { container } = render(
      <Chart
        d3Config={{ withGradient: true }}
        data={data}
        type="area"
        x={x}
        y={y}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });
    const defs = container.querySelector("defs");
    expect(defs).toBeInTheDocument();

    const gradient = container.querySelector("linearGradient");
    expect(gradient).toBeInTheDocument();
  });

  it("renders grid lines when configured", () => {
    const { container } = render(
      <Chart d3Config={{ grid: true }} data={data} x={x} y={y} />,
    );
    act(() => {
      vi.runAllTimers();
    });
    const gridLines = container.querySelectorAll("line");
    expect(gridLines.length).toBeGreaterThan(0);
  });

  it("renders legend when withLegend is true", () => {
    const { container } = render(
      <Chart
        withLegend
        d3Config={{ yAxisLabel: "Line" }}
        data={data}
        type="line"
        x={x}
        y={y}
      />,
    );
    act(() => {
      vi.runAllTimers();
    });
    expect(container.textContent).toMatch(/Line/i);
  });

  it("adjusts margins when labels are large (Auto-Layout)", () => {
    const originalGetBBox = SVGGraphicsElement.prototype.getBBox;
    SVGGraphicsElement.prototype.getBBox = function () {
      if (
        this.tagName.toLowerCase() === "text" ||
        this.tagName.toLowerCase() === "g"
      ) {
        return {
          x: -100,
          y: 0,
          width: 100,
          height: 200,
        } as DOMRect;
      }
      return { x: 0, y: 0, width: 0, height: 0 } as DOMRect;
    };

    try {
      const { container } = render(
        <Chart
          d3Config={{ margin: { left: 40, top: 20, bottom: 20, right: 20 } }}
          data={data}
          x={x}
          y={y}
        />,
      );

      act(() => {
        vi.runAllTimers();
      });

      const g = container.querySelector("g");
      expect(g).toHaveAttribute("transform", "translate(120, 20)");
    } finally {
      // Without the finally, one failure here leaks the prototype patch into
      // every later test in the file and turns one red into seven.
      SVGGraphicsElement.prototype.getBBox = originalGetBBox;
    }
  });

  /**
   * Regression coverage for the interaction pipeline (hover -> onValueChange
   * -> tooltip DOM) surviving every mount lifecycle it can hit in practice:
   * a deferred mount behind a loader gate, data arriving after mount,
   * unmount/remount flicker, and React StrictMode's simulated
   * unmount/remount (dev), which runs effect cleanup + setup against the
   * same memoized Engine instance. Engine.dispose() must be reversible or
   * every pointer signal is silently swallowed afterwards (dead tooltips)
   * while the chart still renders fine.
   */
  describe("interaction pipeline across mount lifecycles", () => {
    /** Simulates `{loading ? <Spinner/> : <Chart/>}` — flips after a tick. */
    function LoaderGate({ children }: { children: React.ReactNode }) {
      const [ready, setReady] = useState(false);
      useEffect(() => {
        const t = setTimeout(() => setReady(true), 50);
        return () => clearTimeout(t);
      }, []);
      return ready ? <>{children}</> : <div>loading…</div>;
    }

    /** Hover over point A (container coords ~(50, 140) with 500x300 + defaults). */
    function hoverPointA(container: HTMLElement) {
      const root = container.querySelector(
        "[data-chart-container]",
      ) as HTMLElement;
      expect(root).toBeTruthy();
      movePointer(root, 60, 150, { pointerType: "mouse" });
    }

    function expectTooltipForA(
      container: HTMLElement,
      onValueChange: ReturnType<typeof vi.fn>,
    ) {
      expect(onValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ label: "A" }),
      );
      expect(
        container.querySelector("[data-chart-tooltip]")?.textContent ?? "",
      ).toContain("A");
    }

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("hover works when mounted directly with data", () => {
      const onValueChange = vi.fn();
      const { container } = render(
        <Chart data={data} x={x} y={y} onValueChange={onValueChange} />,
      );
      act(() => {
        vi.runAllTimers();
      });

      hoverPointA(container);

      expectTooltipForA(container, onValueChange);
    });

    it("hover works when mounted behind a loader gate", () => {
      const onValueChange = vi.fn();
      const { container } = render(
        <LoaderGate>
          <Chart data={data} x={x} y={y} onValueChange={onValueChange} />
        </LoaderGate>,
      );
      act(() => {
        vi.runAllTimers();
      });

      hoverPointA(container);

      expectTooltipForA(container, onValueChange);
    });

    it("hover works when data arrives after mount (empty -> filled)", () => {
      const onValueChange = vi.fn();
      const { container, rerender } = render(
        <Chart data={[]} x={x} y={y} onValueChange={onValueChange} />,
      );
      act(() => {
        vi.runAllTimers();
      });

      rerender(<Chart data={data} x={x} y={y} onValueChange={onValueChange} />);
      act(() => {
        vi.runAllTimers();
      });

      hoverPointA(container);

      expectTooltipForA(container, onValueChange);
    });

    it("hover works after unmount/remount flicker", () => {
      const onValueChange = vi.fn();
      const chart = (
        <Chart data={data} x={x} y={y} onValueChange={onValueChange} />
      );
      const { container, rerender } = render(<div>{chart}</div>);
      act(() => {
        vi.runAllTimers();
      });
      rerender(<div>loading…</div>);
      rerender(<div>{chart}</div>);
      act(() => {
        vi.runAllTimers();
      });

      hoverPointA(container);

      expectTooltipForA(container, onValueChange);
    });

    it("hover survives StrictMode's simulated unmount/remount (direct mount)", () => {
      const disposeSpy = vi.spyOn(Engine.prototype, "dispose");
      const onValueChange = vi.fn();

      const { container } = render(
        <React.StrictMode>
          <Chart data={data} x={x} y={y} onValueChange={onValueChange} />
        </React.StrictMode>,
      );
      act(() => {
        vi.runAllTimers();
      });

      hoverPointA(container);

      // StrictMode really did run the cleanup — the engine must recover from it.
      expect(disposeSpy).toHaveBeenCalled();
      expectTooltipForA(container, onValueChange);
    });

    it("hover survives StrictMode with a loader gate", () => {
      const onValueChange = vi.fn();

      const { container } = render(
        <React.StrictMode>
          <LoaderGate>
            <Chart data={data} x={x} y={y} onValueChange={onValueChange} />
          </LoaderGate>
        </React.StrictMode>,
      );
      act(() => {
        vi.runAllTimers();
      });

      hoverPointA(container);

      expectTooltipForA(container, onValueChange);
    });
  });

  /**
   * The chart resolves pointer coordinates against its container's viewport
   * rect. Anything that moves the chart on screen WITHOUT resizing it — a page
   * scroll, a sticky header collapsing, a sibling chart's tooltip reflowing the
   * page, navigating away and back to a different scroll offset — must not
   * break hit-testing. No ResizeObserver fires for a position-only change, so
   * the container rect has to be correct at the moment the pointer is resolved.
   */
  describe("hover targeting and dismissal", () => {
    const points = [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
      { label: "C", value: 15 },
      { label: "D", value: 25 },
    ];

    let geometry: StubbedGeometry;

    beforeEach(() => {
      vi.restoreAllMocks();
      geometry = stubChartGeometry({ left: 0, top: 0 });
    });

    afterEach(() => {
      geometry.restore();
    });

    function mountChart() {
      const { container } = render(<Chart data={points} x={x} y={y} />);
      act(() => {
        vi.runAllTimers();
      });
      const root = container.querySelector(
        "[data-chart-container]",
      ) as HTMLElement;
      expect(root).toBeTruthy();
      geometry.attach(root);
      return { container, root };
    }

    /** Whatever the tooltip is currently showing, or "" when it is hidden. */
    function tooltipText(container: HTMLElement) {
      return container.querySelector("[data-chart-tooltip]")?.textContent ?? "";
    }

    it("shows the point under the pointer, not always the first one", () => {
      const { container, root } = mountChart();

      movePointer(root, 60, 150, { pointerType: "mouse" });
      expect(tooltipText(container)).toContain("A");

      movePointer(root, 360, 150, { pointerType: "mouse" });

      // Moving to a different point must change what the tooltip reports.
      // Resolving every hover to the first datum would leave this on "A".
      expect(tooltipText(container)).toContain("C");
      expect(tooltipText(container)).not.toContain("A");
    });

    it("hides the tooltip when the pointer leaves the chart", () => {
      const { container, root } = mountChart();

      movePointer(root, 60, 150, { pointerType: "mouse" });
      expect(tooltipText(container)).toContain("A");

      leavePointer(root, { pointerType: "mouse" });

      expect(tooltipText(container)).toBe("");
    });
  });

  describe("interaction after the chart moves on screen", () => {
    const points = [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
      { label: "C", value: 15 },
      { label: "D", value: 25 },
    ];

    let stubs: StubbedGeometry[];

    beforeEach(() => {
      vi.restoreAllMocks();
      stubs = [];
    });

    afterEach(() => {
      stubs.forEach((stub) => stub.restore());
    });

    /** Place a chart at a spot on screen and track it for cleanup. */
    function placeAt(top: number, left = 0) {
      const geometry = stubChartGeometry({ left, top });
      stubs.push(geometry);
      return geometry;
    }

    function renderChart(geometry: StubbedGeometry) {
      const { container } = render(<Chart data={points} x={x} y={y} />);
      act(() => {
        vi.runAllTimers();
      });
      const root = container.querySelector(
        "[data-chart-container]",
      ) as HTMLElement;
      expect(root).toBeTruthy();
      geometry.attach(root);
      return { container, root };
    }

    /** Hover the spot 60px right / 150px down from the chart's top-left corner. */
    function hoverPointA(root: HTMLElement, geometry: StubbedGeometry) {
      const { x: clientX, y: clientY } = geometry.clientPoint(60, 150);
      movePointer(root, clientX, clientY, { pointerType: "mouse" });
    }

    function tooltipShowsA(container: HTMLElement) {
      return (
        container.querySelector("[data-chart-tooltip]")?.textContent ?? ""
      ).includes("A");
    }

    it("hover works after the page scrolls while nothing is hovered", () => {
      const geometry = placeAt(0);
      const { container, root } = renderChart(geometry);

      // Hover once, then leave — this clears the hover interaction, which is
      // the state a user is in whenever they scroll before reaching a chart.
      hoverPointA(root, geometry);
      expect(tooltipShowsA(container)).toBe(true);
      leavePointer(root, { pointerType: "mouse" });

      // Scroll the page. The chart moves; its size is unchanged.
      geometry.moveBy(0, -200);

      hoverPointA(root, geometry);

      expect(tooltipShowsA(container)).toBe(true);
    });

    it("hover works after the page scrolls mid-hover", () => {
      const geometry = placeAt(0);
      const { container, root } = renderChart(geometry);

      hoverPointA(root, geometry);
      expect(tooltipShowsA(container)).toBe(true);

      geometry.moveBy(0, -200);

      hoverPointA(root, geometry);

      expect(tooltipShowsA(container)).toBe(true);
    });

    it("hover works when the chart's position settles after mount", () => {
      const geometry = placeAt(91, 137);
      const { container, root } = renderChart(geometry);

      hoverPointA(root, geometry);

      expect(tooltipShowsA(container)).toBe(true);
    });

    it("a chart that moved still hovers after a sibling chart is used", () => {
      const geometryA = placeAt(0);
      const geometryB = placeAt(400);
      const chartA = renderChart(geometryA);
      const chartB = renderChart(geometryB);

      // Both charts start out working.
      hoverPointA(chartA.root, geometryA);
      expect(tooltipShowsA(chartA.container)).toBe(true);
      leavePointer(chartA.root, { pointerType: "mouse" });

      // Something reflows the page — a sibling tooltip, a lazy image, an
      // expanding panel — and chart A moves while nothing is hovering it.
      geometryA.moveBy(0, -120);

      // The user works with chart B, then comes back to chart A.
      hoverPointA(chartB.root, geometryB);
      expect(tooltipShowsA(chartB.container)).toBe(true);
      leavePointer(chartB.root, { pointerType: "mouse" });

      hoverPointA(chartA.root, geometryA);

      expect(tooltipShowsA(chartA.container)).toBe(true);
    });
  });
});
