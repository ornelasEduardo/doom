import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Chart } from "./Chart";

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

    await waitFor(() => {
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
      if (el === root) {
        return {
          borderLeftWidth: "0px",
          borderTopWidth: "0px",
        } as CSSStyleDeclaration;
      }
      return {} as CSSStyleDeclaration;
    });

    act(() => {
      const event = new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 350,
        clientY: 250,
        pointerType: "mouse",
        isPrimary: true,
      });
      root.dispatchEvent(event);
    });

    await waitFor(() => {
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

    const innerPlot = container.querySelector("[data-chart-inner-plot]");
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

    act(() => {
      const event = new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 150,
        clientY: 150,
        pointerType: "touch",
        isPrimary: true,
      });
      root.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
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

  it("renders area chart with fill path", async () => {
    const { container } = render(<Chart data={data} type="area" x={x} y={y} />);

    await waitFor(() => {
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

  it("adjusts margins when labels are large (Auto-Layout)", async () => {
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

    const { container } = render(
      <Chart
        d3Config={{ margin: { left: 40, top: 20, bottom: 20, right: 20 } }}
        data={data}
        x={x}
        y={y}
      />,
    );

    await waitFor(() => {
      const g = container.querySelector("g");
      expect(g).toHaveAttribute("transform", "translate(120, 20)");
    });

    SVGGraphicsElement.prototype.getBBox = originalGetBBox;
  });
});
