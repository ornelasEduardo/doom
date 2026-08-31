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
  private containerElement: Element | null = null;
  private plotElement: Element | null = null;
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
    this.containerElement = element;
    this.plotElement = plotElement;

    if (element) {
      this.containerRect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      this.containerStyle = {
        borderLeft: parseFloat(style.borderLeftWidth) || 0,
        borderTop: parseFloat(style.borderTopWidth) || 0,
        paddingLeft: parseFloat(style.paddingLeft) || 0,
        paddingTop: parseFloat(style.paddingTop) || 0,
      };

      this.plotOffset = this.measurePlotOffset(this.containerRect);
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
    // The plot's offset inside the container is derived from both rects, so it
    // has to be re-measured whenever either one changes. A layout change can
    // move the plot within a container that did not itself move or resize —
    // a header wrapping to two lines, a legend appearing — and leaving the old
    // offset in place would silently skew every pointer coordinate.
    this.plotOffset = this.measurePlotOffset(rect);
    if (plotBounds) {
      this.plotBounds = plotBounds;
    }
  }

  /**
   * Measure where the plot area starts, relative to the container's padding box.
   * Falls back to the container's padding when there is no plot element.
   */
  private measurePlotOffset(containerRect: DOMRect): { x: number; y: number } {
    if (!this.plotElement) {
      return {
        x: this.containerStyle.paddingLeft,
        y: this.containerStyle.paddingTop,
      };
    }

    const plotRect = this.plotElement.getBoundingClientRect();
    return {
      x: plotRect.left - containerRect.left - this.containerStyle.borderLeft,
      y: plotRect.top - containerRect.top - this.containerStyle.borderTop,
    };
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
    // Read the rect live rather than trusting the cached one. Client
    // coordinates are viewport-relative, so any scroll or layout shift moves
    // the container underneath a cached rect — and a position-only change
    // fires no ResizeObserver, so nothing would invalidate it. Falls back to
    // the last explicitly-set rect for callers driving the system without an
    // element (updateBounds).
    const rect = this.containerElement
      ? this.containerElement.getBoundingClientRect()
      : this.containerRect;

    if (!rect) {
      return null;
    }

    return {
      x: clientX - rect.left - this.containerStyle.borderLeft,
      y: clientY - rect.top - this.containerStyle.borderTop,
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
