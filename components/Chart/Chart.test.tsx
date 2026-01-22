import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Chart } from "./Chart";

// Mock ResizeObserver
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
  global.ResizeObserver = MockResizeObserver;

  // Force Polyfill SVG methods (JSDOM implementation might be partial or
  // missing methods like inverse/matrixTransform)
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
});

describe("Chart", () => {
  const data = [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
  ];
  const x = (d: any) => d.label;
  const y = (d: any) => d.value;

  it("renders without crashing", async () => {
    const { container } = render(<Chart data={data} x={x} y={y} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector("path")).toBeInTheDocument();
    });
  });

  it("renders bars for bar chart (using paths)", async () => {
    const { container } = render(<Chart data={data} type="bar" x={x} y={y} />);
    await waitFor(() => {
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  it("renders a custom visualization via render prop", async () => {
    const renderSpy = vi.fn();
    render(<Chart data={data} render={renderSpy} x={x} y={y} />);

    await waitFor(() => {
      expect(renderSpy).toHaveBeenCalled();
    });

    const ctx = renderSpy.mock.calls[0][0];

    expect(ctx).toHaveProperty("g");
    expect(ctx).toHaveProperty("xScale");
    expect(ctx).toHaveProperty("yScale");
    expect(ctx).toHaveProperty("showTooltip");
    expect(ctx).toHaveProperty("hideTooltip");
    expect(ctx.innerWidth).toBe(500 - ctx.margin.left - ctx.margin.right);
  });

  it("renders axes labels when configured", async () => {
    const { getByText } = render(
      <Chart
        d3Config={{ xAxisLabel: "Time", yAxisLabel: "Value" }}
        data={data}
        x={x}
        y={y}
      />,
    );
    await waitFor(() => {
      expect(getByText("Time")).toBeInTheDocument();
      expect(getByText("Value")).toBeInTheDocument();
    });
  });

  it("supports interaction helpers (showTooltip)", async () => {
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

    await waitFor(() => expect(capturedCtx).toBeDefined());

    act(() => {
      const event = { type: "mousemove", clientX: 100, clientY: 100 };
      capturedCtx.showTooltip(event, data[0]);
    });

    // Check if Tooltip rendered.
    // Value is "10", Label is "A".
    await waitFor(() => {
      // Use role heading to distinguish from axis text if necessary, or just
      // by check document
      // Note: Text variant="h4" usually renders h4
      expect(screen.getByRole("heading", { name: "10" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "A" })).toBeInTheDocument();
    });

    act(() => {
      capturedCtx.hideTooltip();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "10" }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows tooltip on mouse interaction", async () => {
    const { container } = render(<Chart data={data} x={x} y={y} />);

    // Wait for chart to be ready (look for SVG)
    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    const root = container.firstChild as HTMLElement;
    const svg = container.querySelector("svg");
    const wrapper = svg?.parentElement as HTMLElement;

    // Mock getBoundingClientRect for both container and plot wrapper
    // Container
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 100,
      width: 500,
      height: 300,
      x: 100,
      y: 100,
      bottom: 400,
      right: 600,
      toJSON: () => {},
    } as DOMRect);

    // Plot Wrapper (same dims for auto-layout effectively)
    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 100,
      width: 500,
      height: 300,
      x: 100,
      y: 100,
      bottom: 400,
      right: 600,
      toJSON: () => {},
    } as DOMRect);

    // Also need container style for borders (Root reads computed style)
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      if (el === root) {
        return {
          borderLeftWidth: "0px",
          borderTopWidth: "0px",
        } as CSSStyleDeclaration;
      }
      return {} as CSSStyleDeclaration;
    });

    // Simulate mouse move
    // clientX 160. Container Left 100. -> ContainerX = 60.
    // Chart Left 100. -> ChartX = 60.
    // Margin Left defaults to 70? Or calculated?
    // In Chart.stories or implementation, default might be different.
    // Usually margin is { left: 50... }.
    // If left margin is > 60, we might clamp or miss.
    // Let's use a clear value. Center of char: 100 + 250 = 350.

    act(() => {
      const event = new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 350,
        clientY: 250,
      });
      // Dispatch on root container (where listener is)
      root.dispatchEvent(event);
    });

    await waitFor(() => {
      // Should find active data tooltip. Data "A" or "B".
      // At 350 (midway), likely between A and B or near B?
      // Just check for *any* heading which indicates tooltip content.
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    });
  });

  it("shows tooltip on touch interaction", async () => {
    const { container } = render(<Chart data={data} x={x} y={y} />);

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    const root = container.firstChild as HTMLElement;
    const svg = container.querySelector("svg");
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

    act(() => {
      // Simulate touch as pointer event (React abstracts this anyway, or we can use touchStart/Move)
      // But Root uses onPointerMove.
      // So let's fire pointerMove with isPrimary/pointerType='touch'
      fireEvent.pointerMove(root, {
        bubbles: true,
        clientX: 150,
        clientY: 150,
        pointerType: "touch",
        isPrimary: true,
      });
    });

    await waitFor(() => {
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    });
  });

  it.skip("correctly resolves element data and ignores background", async () => {
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
    await waitFor(() => expect(capturedCtx).toBeDefined());

    const mockElement = document.createElement("div");
    (mockElement as any).__data__ = data[0];

    // Mock elementFromPoint to return our element
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => mockElement);

    // Test successful resolution
    const result = capturedCtx.resolveInteraction({
      type: "touchmove",
      touches: [{ clientX: 10, clientY: 10 }],
      preventDefault: vi.fn(),
      cancelable: true,
    });

    expect(result).not.toBeNull();
    expect(result.element).toBe(mockElement);
    expect(result.data).toBe(data[0]);

    // Test Array data (background/group) - should be ignored
    (mockElement as any).__data__ = data;
    const badResult = capturedCtx.resolveInteraction({
      type: "touchmove",
      touches: [{ clientX: 10, clientY: 10 }],
      preventDefault: vi.fn(),
      cancelable: true,
    });

    expect(badResult).toBeNull();

    // Cleanup
    document.elementFromPoint = originalElementFromPoint;
  });

  it("renders area chart with fill path", async () => {
    const { container } = render(<Chart data={data} type="area" x={x} y={y} />);

    await waitFor(() => {
      // Area charts should have both a fill path and a line path
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("renders area chart with gradient when configured", async () => {
    const { container } = render(
      <Chart
        d3Config={{ withGradient: true }}
        data={data}
        type="area"
        x={x}
        y={y}
      />,
    );

    await waitFor(() => {
      // Should have a gradient definition
      const defs = container.querySelector("defs");
      expect(defs).toBeInTheDocument();

      const gradient = container.querySelector("linearGradient");
      expect(gradient).toBeInTheDocument();
    });
  });

  it("renders grid lines when configured", async () => {
    const { container } = render(
      <Chart d3Config={{ grid: true }} data={data} x={x} y={y} />,
    );

    await waitFor(() => {
      // Grid renders lines in a group
      const gridLines = container.querySelectorAll("line");
      expect(gridLines.length).toBeGreaterThan(0);
    });
  });

  it("renders legend when withLegend is true", async () => {
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

    await waitFor(() => {
      expect(container.textContent).toMatch(/Line/i);
    });
  });

  // TODO: Restore auto-layout logic in Axis component
  it.skip("adjusts margins when labels are large (Auto-Layout)", async () => {
    // Mock getBBox to return large width
    const originalGetBBox = SVGGraphicsElement.prototype.getBBox;
    SVGGraphicsElement.prototype.getBBox = function () {
      // console.log("getBBox called on:", this.tagName);
      // If this is a text element (axis label), return large width
      if (this.tagName.toLowerCase() === "text") {
        return {
          x: -100, // Starts way to the left
          y: 0,
          width: 100,
          height: 20,
        } as DOMRect;
      }
      return { x: 0, y: 0, width: 0, height: 0 } as DOMRect;
    };

    const { container } = render(
      <Chart
        d3Config={{ margin: { left: 40, top: 20, bottom: 20, right: 20 } }}
        data={data}
        x={x}
        y={y}
      />,
    );

    // Initial render might have left: 40.
    // The auto-layout logic should run and detect minX = -100.
    // Required left = 100 + 20 = 120.
    // So margin.left should become 120.

    await waitFor(() => {
      const g = container.querySelector("g");
      // transform="translate(120,20)"
      expect(g).toHaveAttribute("transform", "translate(120,20)");
    });

    // Cleanup
    SVGGraphicsElement.prototype.getBBox = originalGetBBox;
  });
});
