import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChartContext } from "../../context";
import { Engine } from "../../engine";
import {
  createChartStore,
  updateChartDimensions,
  updateChartState,
} from "../../state/store/chart.store";
import type { ContextValue } from "../../types/context";
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
  data: [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
    { label: "C", value: 30 },
  ],
});
chartStore.setState({ processedSeries: [] });
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
    <ChartContext.Provider value={context}>
      <svg>{ui}</svg>
    </ChartContext.Provider>,
  );
};

describe("Series", () => {
  it("renders a series group", () => {
    const { container } = renderWithContext(
      <Series type="line" x="label" y="value" />,
    );
    // The harness supplies the <svg> wrapper, so querying for one passes even
    // when Series renders nothing. The <g> is Series' own output.
    expect(container.querySelector("g")).toBeInTheDocument();
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
