export interface ContainerStyle {
  borderLeft: number;
  borderTop: number;
  paddingLeft: number;
  paddingTop: number;
}

export interface PlotBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartCoordinates {
  chartX: number;
  chartY: number;
  isWithinPlot: boolean;
}

/**
 * CoordinateSystem
 *
 * Handles the complexity of mapping screen coordinates (ClientX/Y)
 * to Chart coordinates (PlotX/Y), accounting for:
 * - Container position (getBoundingClientRect)
 * - CSS Borders and Padding
 * - Layout offsets (e.g. Headers pushing the plot down)
 */
export class CoordinateSystem {
  private containerRect: DOMRect | null = null;
  private containerStyle: ContainerStyle = {
    borderLeft: 0,
    borderTop: 0,
    paddingLeft: 0,
    paddingTop: 0,
  };

  private plotOffset: { x: number; y: number } = { x: 0, y: 0 };
  private plotBounds: PlotBounds | null = null;

  /**
   * Set the container element and its bounds.
   * Call this on mount and when the container resizes.
   */
  setContainer(
    element: Element | null,
    plotElement: Element | null = null,
    plotBounds?: PlotBounds,
  ): void {
    if (element) {
      this.containerRect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      this.containerStyle = {
        borderLeft: parseFloat(style.borderLeftWidth) || 0,
        borderTop: parseFloat(style.borderTopWidth) || 0,
        paddingLeft: parseFloat(style.paddingLeft) || 0,
        paddingTop: parseFloat(style.paddingTop) || 0,
      };

      // Calculate plot offset if plotElement is provided
      if (plotElement) {
        const plotRect = plotElement.getBoundingClientRect();
        this.plotOffset = {
          x:
            plotRect.left -
            this.containerRect.left -
            this.containerStyle.borderLeft,
          y:
            plotRect.top -
            this.containerRect.top -
            this.containerStyle.borderTop,
        };
      } else {
        // Fallback to padding
        this.plotOffset = {
          x: this.containerStyle.paddingLeft,
          y: this.containerStyle.paddingTop,
        };
      }
    } else {
      this.containerRect = null;
      this.containerStyle = {
        borderLeft: 0,
        borderTop: 0,
        paddingLeft: 0,
        paddingTop: 0,
      };
      this.plotOffset = { x: 0, y: 0 };
    }

    if (plotBounds) {
      this.plotBounds = plotBounds;
    }
  }

  /**
   * Update the container bounds explicitly (e.g. from ResizeObserver).
   */
  updateBounds(rect: DOMRect, plotBounds?: PlotBounds): void {
    this.containerRect = rect;
    if (plotBounds) {
      this.plotBounds = plotBounds;
    }
  }

  getContainerRect(): DOMRect | null {
    return this.containerRect;
  }

  getContainerStyle(): ContainerStyle {
    return this.containerStyle;
  }

  getPlotOffset(): { x: number; y: number } {
    return this.plotOffset;
  }

  getPlotBounds(): PlotBounds | null {
    return this.plotBounds;
  }

  /**
   * Resolve a pointer event to container-relative (padding-box) coordinates.
   */
  resolvePointerCoordinates(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } | null {
    if (!this.containerRect) {
      return null;
    }

    return {
      x: clientX - this.containerRect.left - this.containerStyle.borderLeft,
      y: clientY - this.containerRect.top - this.containerStyle.borderTop,
    };
  }

  /**
   * Calculate coordinates relative to the plot area.
   */
  resolveChartCoordinates(
    containerX: number,
    containerY: number,
  ): ChartCoordinates {
    // If we have plot bounds (from d3 scales/margin), use them for plotting
    // Note: containerX/Y here are expected to be relative to the Plot Offset already?
    // Wait, the previous implementation passed "searchX/Y" which were (signal.x - plotOffset).
    // Let's keep it consistent.

    if (!this.plotBounds) {
      // If no plot bounds defined, assume full container? OR just return relative coords
      return { chartX: containerX, chartY: containerY, isWithinPlot: true };
    }

    // plotBounds.x/y are usually the margin.left/top
    // If containerX is already relative to the visual plot origin (wrapper),
    // and margin is inside that wrapper (SVG g transform), then we need to subtract margin.

    const chartX = containerX - this.plotBounds.x;
    const chartY = containerY - this.plotBounds.y;

    const isWithinPlot =
      chartX >= 0 &&
      chartX <= this.plotBounds.width &&
      chartY >= 0 &&
      chartY <= this.plotBounds.height;

    return { chartX, chartY, isWithinPlot };
  }
}
