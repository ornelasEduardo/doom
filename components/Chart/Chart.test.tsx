import { act, render, screen, waitFor } from "@testing-library/react";
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
      matrixTransform: function (m: any) {
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

    await waitFor(() => {
      expect(container.querySelector(".overlay")).toBeInTheDocument();
    });

    const svg = container.querySelector("svg");
    const overlay = container.querySelector(".overlay");

    // Mock getBoundingClientRect for coordinate calculation
    vi.spyOn(svg!, "getBoundingClientRect").mockReturnValue({
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

    // Simulate mouse move
    // Chart dimensions: 500x300. Margins: left~55, top~20.
    // We want to hit the first data point ("A", value 10).
    // Domain is "A", "B". Point scale distributes them.
    // "A" should be near the start (or spread depending on scale type handling
    // of strings).
    // Let's rely on finding *any* tooltip content.

    act(() => {
      // clientX 160 -> relative x = 60. With left margin 55, this is inside
      // chart area.
      const event = new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 160,
        clientY: 150,
      });
      overlay!.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "A" })).toBeInTheDocument();
    });
  });

  it("shows tooltip on touch interaction", async () => {
    const { container } = render(<Chart data={data} x={x} y={y} />);

    await waitFor(() => {
      expect(container.querySelector(".overlay")).toBeInTheDocument();
    });

    const svg = container.querySelector("svg");
    const overlay = container.querySelector(".overlay");

    vi.spyOn(svg!, "getBoundingClientRect").mockReturnValue({
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
      // Simulate touch move
      const event = new TouchEvent("touchmove", {
        bubbles: true,
        touches: [
          {
            clientX: 60,
            clientY: 50,
            force: 1,
            identifier: 0,
            target: overlay!,
            pageX: 60,
            pageY: 50,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0,
          } as unknown as Touch,
        ],
      });
      overlay!.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "A" })).toBeInTheDocument();
    });
  });

  it("correctly resolves element data and ignores background", async () => {
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
      // Grid renders a group with multiple line elements
      // The grid group has lines with x2 attribute spanning the width
      const gridLines = container.querySelectorAll("g.tick line[x2]");
      expect(gridLines.length).toBeGreaterThan(0);
    });
  });
});
