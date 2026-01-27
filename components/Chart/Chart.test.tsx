import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Chart } from "./Chart";
import { leavePointer, movePointer } from "./tests/chart-test-utils";

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

  it("renders bars for bar chart (using paths)", () => {
    const { container } = render(<Chart data={data} type="bar" x={x} y={y} />);

    act(() => {
      vi.runAllTimers();
    });

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
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

    SVGGraphicsElement.prototype.getBBox = originalGetBBox;
  });
});
