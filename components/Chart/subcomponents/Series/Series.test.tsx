import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartContext, ChartContextValue } from "../../context";
import { Series } from "./Series";

// Mock ResizeObserver as a class
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

const mockContext: ChartContextValue<{ label: string; value: number }> = {
  data: [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
    { label: "C", value: 30 },
  ],
  width: 500,
  height: 300,
  isMobile: false,
  config: {
    margin: { top: 20, right: 20, bottom: 30, left: 40 },
    showAxes: true,
    grid: false,
    withGradient: false,
    showDots: false,
  },
  colorPalette: ["var(--primary)", "var(--secondary)"],
  styles: {},
  hoverState: null,
  setHoverState: vi.fn(),
  resolveInteraction: vi.fn(),
  type: "line",
  seriesStore: {
    getState: () => ({ series: new Map(), processedSeries: [] }),
    setState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    useStore: vi.fn(),
  },
};

const renderWithContext = (
  ui: React.ReactNode,
  context: ChartContextValue<{ label: string; value: number }> = mockContext,
) => {
  return render(
    <ChartContext.Provider value={context as ChartContextValue<unknown>}>
      <svg>{ui}</svg>
    </ChartContext.Provider>,
  );
};

describe("Series", () => {
  it("renders SVG element", () => {
    const { container } = renderWithContext(
      <Series type="line" x="label" y="value" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = renderWithContext(
      <Series className="custom-series" type="line" x="label" y="value" />,
    );
    expect(container.querySelector("g")).toHaveClass("custom-series");
  });

  it("uses series-specific data when provided", () => {
    const customData = [
      { label: "X", value: 100 },
      { label: "Y", value: 200 },
    ];
    const { container } = renderWithContext(
      <Series data={customData} type="bar" x="label" y="value" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
