import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
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
      this
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver;

  // Force Polyfill SVG methods (JSDOM implementation might be partial or missing methods like inverse/matrixTransform)
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
    const { container } = render(<Chart data={data} x={x} y={y} type="bar" />);
    await waitFor(() => {
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  it("renders a custom visualization via render prop", async () => {
    const renderSpy = vi.fn();
    render(<Chart data={data} x={x} y={y} render={renderSpy} />);

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
        data={data}
        x={x}
        y={y}
        d3Config={{ xAxisLabel: "Time", yAxisLabel: "Value" }}
      />
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
        x={x}
        y={y}
        render={(ctx) => {
          capturedCtx = ctx;
        }}
      />
    );

    await waitFor(() => expect(capturedCtx).toBeDefined());

    act(() => {
      const event = { type: "mousemove", clientX: 100, clientY: 100 };
      capturedCtx.showTooltip(event, data[0]);
    });

    // Check if Tooltip rendered.
    // Value is "10", Label is "A".
    await waitFor(() => {
      // Use role heading to distinguish from axis text if necessary, or just be check document
      // Note: Text variant="h4" usually renders h4
      expect(screen.getByRole("heading", { name: "10" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "A" })).toBeInTheDocument();
    });

    act(() => {
      capturedCtx.hideTooltip();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "10" })
      ).not.toBeInTheDocument();
    });
  });
});
