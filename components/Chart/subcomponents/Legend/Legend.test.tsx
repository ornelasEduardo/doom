import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChartContext } from "../../context";
import { Engine } from "../../engine";
import {
  createChartStore,
  updateChartDimensions,
  updateChartState,
} from "../../state/store/chart.store";
import type { ContextValue } from "../../types/context";
import { Legend } from "./Legend";

const config = {
  margin: { top: 20, right: 20, bottom: 30, left: 40 },
  showAxes: true,
  grid: false,
  showDots: false,
};
const chartStore = createChartStore(config);
updateChartDimensions(chartStore, 500, 300);
updateChartState(chartStore, {
  dimensions: chartStore.getState().dimensions,
  data: [],
});
chartStore.setState({
  processedSeries: [
    { id: "series-a", label: "Series A", color: "red" },
    { id: "series-b", label: "Series B", color: "blue" },
  ],
});
const mockContext: ContextValue = {
  chartStore,
  engine: new Engine(),
  config,
  isMobile: false,
  colorPalette: ["var(--primary)", "var(--secondary)"],
  styles: {},
  resolveInteraction: () => null,
  type: "line",
};

const renderWithContext = (
  ui: React.ReactNode,
  context: ContextValue = mockContext,
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
    const emptyContext: ContextValue = {
      ...mockContext,
      chartStore: createChartStore(config),
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
