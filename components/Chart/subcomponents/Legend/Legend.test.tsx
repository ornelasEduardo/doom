import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChartContext, ChartContextValue } from "../../context";
import { Legend } from "./Legend";

const mockContext: ChartContextValue<unknown> = {
  data: [],
  width: 500,
  height: 300,
  isMobile: false,
  config: {
    margin: { top: 20, right: 20, bottom: 30, left: 40 },
    showAxes: true,
    grid: false,
    showDots: false,
  },
  colorPalette: ["var(--primary)", "var(--secondary)"],
  styles: {},
  resolveInteraction: vi.fn(),
  type: "line",
  seriesStore: {
    getState: () => ({
      series: new Map(),
      processedSeries: [
        { id: "series-a", label: "Series A", color: "red" },
        { id: "series-b", label: "Series B", color: "blue" },
      ],
    }),
    setState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    useStore: (selector: any) =>
      selector({
        series: new Map(),
        processedSeries: [
          { id: "series-a", label: "Series A", color: "red" },
          { id: "series-b", label: "Series B", color: "blue" },
        ],
      }),
  },
  chartStore: {
    getState: () => ({
      series: new Map(),
      processedSeries: [
        { id: "series-a", label: "Series A", color: "red" },
        { id: "series-b", label: "Series B", color: "blue" },
      ],
      interactions: new Map(),
      scales: { x: null, y: null },
      dimensions: { width: 500, height: 300 },
    }),
    setState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    useStore: (selector: any) =>
      selector({
        series: new Map(),
        processedSeries: [
          { id: "series-a", label: "Series A", color: "red" },
          { id: "series-b", label: "Series B", color: "blue" },
        ],
        interactions: new Map(),
        scales: { x: null, y: null },
        dimensions: { width: 500, height: 300 },
      }),
  } as any,
};

const renderWithContext = (
  ui: React.ReactNode,
  context: ChartContextValue<unknown> = mockContext,
) => {
  return render(
    <ChartContext.Provider value={context}>{ui}</ChartContext.Provider>,
  );
};

describe("Legend", () => {
  it("renders legend items from context", () => {
    renderWithContext(<Legend />);
    expect(screen.getByText("Series A")).toBeInTheDocument();
  });

  it("renders custom items when provided", () => {
    renderWithContext(<Legend items={[{ label: "Custom", color: "green" }]} />);
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("renders items from function", () => {
    renderWithContext(
      <Legend
        items={(items) =>
          items.map((i) => ({ ...i, label: `Modified ${i.label}` }))
        }
      />,
    );
    expect(screen.getByText("Modified Series A")).toBeInTheDocument();
  });

  it("returns null when no items", () => {
    const emptyContext = {
      ...mockContext,
      legendItems: [],
      seriesStore: {
        ...mockContext.seriesStore,
        useStore: (selector: any) =>
          selector({ series: new Map(), processedSeries: [] }),
      },
      chartStore: {
        ...mockContext.chartStore,
        useStore: (selector: any) =>
          selector({ series: new Map(), processedSeries: [] }),
      },
    };
    const { container } = renderWithContext(<Legend />, emptyContext);
    expect(container.firstChild).toBeNull();
  });

  it("applies horizontal layout by default", () => {
    renderWithContext(<Legend />);
    const legend = screen.getByText("Series A").closest("div")?.parentElement;
    expect(legend).toHaveStyle({ flexDirection: "row" });
  });

  it("applies vertical layout when specified", () => {
    renderWithContext(<Legend layout="vertical" />);
    const legend = screen.getByText("Series A").closest("div")?.parentElement;
    expect(legend).toHaveStyle({ flexDirection: "column" });
  });

  it("applies custom className", () => {
    renderWithContext(<Legend className="custom-legend" />);
    const legend = screen.getByText("Series A").closest("div")?.parentElement;
    expect(legend).toHaveClass("custom-legend");
  });
});
