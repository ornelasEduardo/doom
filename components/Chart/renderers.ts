/**
 * Chart Renderers
 *
 * D3-based rendering functions for charts. Each renderer handles
 * drawing a specific chart type (line, area, bar) and managing
 * user interactions (hover, touch).
 */

import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3Scale from "d3-scale";
import * as d3Selection from "d3-selection";
import * as d3Shape from "d3-shape";

import { ChartConfig, D3Selection, DrawContext, SVGSelection } from "./types";

const d3 = {
  ...d3Scale,
  ...d3Shape,
  ...d3Selection,
  ...d3Axis,
  ...d3Array,
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Extracts pointer coordinates from mouse or touch events.
 * Uses the parent SVG as reference for accurate positioning across all devices.
 */
function getPointerCoords(
  event: TouchEvent | MouseEvent,
  gElement: SVGGElement | null,
  margin: { left: number; top: number },
): [number, number] {
  if (!gElement) {
    return [0, 0];
  }

  const svg = gElement.ownerSVGElement;
  if (!svg) {
    return [0, 0];
  }

  const rect = svg.getBoundingClientRect();
  let clientX: number;
  let clientY: number;

  if ("touches" in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if ("changedTouches" in event && event.changedTouches.length > 0) {
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
  } else {
    clientX = (event as MouseEvent).clientX;
    clientY = (event as MouseEvent).clientY;
  }

  return [clientX - rect.left - margin.left, clientY - rect.top - margin.top];
}

/**
 * Creates an SVG path for a rectangle with rounded top corners.
 * Used for bar charts to create a softer, modern look.
 */
function createRoundedTopBarPath(
  xPos: number,
  yPos: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = Math.min(radius, width / 2, height);
  return `
    M ${xPos},${yPos + height}
    L ${xPos},${yPos + r}
    A ${r},${r} 0 0 1 ${xPos + r},${yPos}
    L ${xPos + width - r},${yPos}
    A ${r},${r} 0 0 1 ${xPos + width},${yPos + r}
    L ${xPos + width},${yPos + height}
    Z
  `;
}

// ============================================================================
// SCALE & AXIS SETUP
// ============================================================================

/**
 * Creates X and Y scales based on data and chart dimensions.
 * Automatically selects appropriate scale type (linear, point, band).
 */
export function createScales<T>(
  data: T[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  x: (d: T) => string | number,
  y: (d: T) => number,
  type?: "line" | "area" | "bar",
) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xValues = data.map(x);
  let xScale:
    | d3Scale.ScaleLinear<number, number>
    | d3Scale.ScalePoint<string>
    | d3Scale.ScaleBand<string>;

  if (typeof xValues[0] === "number") {
    xScale = d3
      .scaleLinear()
      .domain(d3.extent(xValues as number[]) as [number, number])
      .range([0, innerWidth]);
  } else {
    xScale = d3
      .scalePoint()
      .domain(xValues as string[])
      .range([0, innerWidth])
      .padding(0);
  }

  if (type === "bar") {
    xScale = d3
      .scaleBand()
      .domain(xValues as string[])
      .range([0, innerWidth])
      .padding(0.1);
  }

  const yValues = data.map(y);
  const yScale = d3
    .scaleLinear()
    .domain([0, (d3.max(yValues) || 0) * 1.1])
    .nice()
    .range([innerHeight, 0]);

  return { xScale, yScale, innerWidth, innerHeight };
}

/**
 * Sets up an SVG gradient for area chart fills.
 */
export function setupGradient(svg: SVGSelection, gradientId: string) {
  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "var(--primary)")
    .attr("stop-opacity", 0.5);

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "var(--primary)")
    .attr("stop-opacity", 0);
}

/**
 * Draws horizontal grid lines behind the chart.
 */
export function drawGrid(
  g: D3Selection,
  yScale: d3Scale.ScaleLinear<number, number>,
  innerWidth: number,
  className: string,
) {
  g.append("g")
    .attr("class", className)
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => ""),
    );
}

/**
 * Draws X and Y axes with labels.
 * Automatically adjusts tick count to prevent label overlap.
 */
export function drawAxes(
  g: D3Selection,
  xScale:
    | d3Scale.ScaleLinear<number, number>
    | d3Scale.ScalePoint<string>
    | d3Scale.ScaleBand<string>,
  yScale: d3Scale.ScaleLinear<number, number>,
  innerWidth: number,
  innerHeight: number,
  margin: { top: number; right: number; bottom: number; left: number },
  config: ChartConfig,
  styles: Record<string, string>,
  isMobile: boolean,
) {
  const TICK_WIDTH = 40; // Approximate width of a tick label
  const maxTicks = Math.floor(innerWidth / TICK_WIDTH);

  const axisBottom = d3.axisBottom(xScale as any);

  if ("domain" in xScale && Array.isArray(xScale.domain())) {
    const domain = xScale.domain() as string[];
    if (domain.length > maxTicks) {
      const step = Math.ceil(domain.length / maxTicks);
      axisBottom.tickValues(domain.filter((_, i) => i % step === 0));
    }
  } else {
    axisBottom.ticks(Math.min(5, maxTicks));
  }

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(axisBottom);

  const yAxis = g.append("g").call(
    d3
      .axisLeft(yScale)
      .ticks(isMobile ? 3 : 5)
      .tickPadding(10),
  );

  if (config.hideYAxisDomain) {
    yAxis.select(".domain").remove();
  }

  if (config.xAxisLabel) {
    g.append("text")
      .attr("class", styles.axisLabel)
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 4)
      .text(config.xAxisLabel);
  }

  if (config.yAxisLabel) {
    g.append("text")
      .attr("class", styles.axisLabel)
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 12)
      .text(config.yAxisLabel);
  }
}

// ============================================================================
// CHART RENDERERS
// ============================================================================

/**
 * Renders line and area charts with interactive cursor tracking.
 */
export function drawLineArea<T>({
  g,
  data,
  xScale,
  yScale,
  x,
  y,
  innerWidth,
  innerHeight,
  config,
  styles,
  gradientId,
  setHoverState,
  margin,
  type,
}: DrawContext<T>) {
  const lineGenerator = d3
    .line<T>()
    .x((d) => xScale(x(d)) ?? 0)
    .y((d) => yScale(y(d)))
    .curve(config.curve || d3.curveLinear);

  if (type === "area") {
    const areaGenerator = d3
      .area<T>()
      .x((d) => xScale(x(d)) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(y(d)))
      .curve(config.curve || d3.curveLinear);

    const areaPath = g
      .append("path")
      .datum(data)
      .attr("class", styles.area)
      .attr("d", areaGenerator);

    if (config.withGradient) {
      areaPath.style("fill", `url(#${gradientId})`);
    } else {
      areaPath.style("fill-opacity", 0.1);
    }
  }

  g.append("path")
    .datum(data)
    .attr("class", styles.path)
    .attr("d", lineGenerator);

  if (config.showDots) {
    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", styles.dot)
      .attr("cx", (d) => xScale(x(d)) ?? 0)
      .attr("cy", (d) => yScale(y(d)))
      .attr("r", 5);
  }

  const overlay = g
    .append("rect")
    .attr("class", "overlay")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .style("fill", "transparent")
    .style("cursor", "crosshair")
    .style("touch-action", "none");

  const cursorLine = g
    .append("line")
    .attr("class", styles.cursorLine)
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .style("opacity", 0);

  const cursorDot = g
    .append("circle")
    .attr("class", styles.cursorPoint)
    .attr("r", 6)
    .style("opacity", 0);

  const findNearestPoint = (pointerX: number): T | null => {
    if ("invert" in xScale && typeof xScale.invert === "function") {
      const x0 = xScale.invert(pointerX);
      const bisect = d3.bisector(x).left;
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];

      if (!d0) {
        return d1;
      }
      if (!d1) {
        return d0;
      }

      const d0Dist = (x0 as number) - (x(d0) as number);
      const d1Dist = (x(d1) as number) - (x0 as number);
      return d0Dist > d1Dist ? d1 : d0;
    } else if ("step" in xScale && typeof xScale.step === "function") {
      const step = xScale.step();
      const index = Math.round(pointerX / step);
      return data[Math.min(Math.max(0, index), data.length - 1)];
    }
    return null;
  };

  const handleInteraction = (event: any) => {
    if (event.type.startsWith("touch") && event.cancelable) {
      event.preventDefault();
    }

    const [pointerX, pointerY] = getPointerCoords(event, g.node(), margin);
    const selectedData = findNearestPoint(pointerX);

    if (selectedData) {
      const cx = xScale(x(selectedData)) ?? 0;
      const cy = yScale(y(selectedData));

      cursorLine.attr("x1", cx).attr("x2", cx).style("opacity", 1);
      cursorDot.attr("cx", cx).attr("cy", cy).style("opacity", 1);

      const isTouch = event.type.startsWith("touch");
      setHoverState({
        x: (isTouch ? cx : pointerX) + margin.left,
        y: (isTouch ? cy : pointerY) + margin.top, // Snap Y to point on touch, cursor on mouse
        data: selectedData,
      });
    }
  };

  overlay
    .on("mousemove touchmove touchstart", handleInteraction)
    .on("mouseleave touchend touchcancel", () => {
      cursorLine.style("opacity", 0);
      cursorDot.style("opacity", 0);
      setHoverState(null);
    });
}

/**
 * Renders bar charts with hover highlighting.
 */
export function drawBars<T>({
  g,
  data,
  xScale,
  yScale,
  x,
  y,
  innerWidth,
  innerHeight,
  styles,
  setHoverState,
  margin,
}: DrawContext<T>) {
  const BAR_RADIUS = 4;

  const bars = g
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("path")
    .attr("class", styles.bar)
    .attr("d", (d) => {
      const xVal = xScale(x(d)) || 0;
      const yVal = yScale(y(d));
      const w = "bandwidth" in xScale ? xScale.bandwidth() : 10;
      const h = innerHeight - yVal;
      return createRoundedTopBarPath(xVal, yVal, w, h, BAR_RADIUS);
    });

  const overlay = g
    .append("rect")
    .attr("class", "overlay")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .style("fill", "transparent")
    .style("cursor", "crosshair")
    .style("touch-action", "none");

  const findNearestBar = (pointerX: number): T | null => {
    const bandwidth = "bandwidth" in xScale ? xScale.bandwidth() : 10;
    let nearestData: T | null = null;
    let minDist = Infinity;

    for (const d of data) {
      const barX = xScale(x(d)) || 0;
      const barCenter = barX + bandwidth / 2;
      const dist = Math.abs(pointerX - barCenter);

      if (dist < minDist) {
        minDist = dist;
        nearestData = d;
      }
    }

    return nearestData;
  };

  const handleInteraction = (event: any) => {
    if (event.type.startsWith("touch") && event.cancelable) {
      event.preventDefault();
    }

    const [pointerX, pointerY] = getPointerCoords(event, g.node(), margin);
    const selectedData = findNearestBar(pointerX);

    if (selectedData) {
      bars.style("opacity", (d) => (d === selectedData ? 1 : 0.6));

      let hoverX = pointerX;
      let hoverY = pointerY;

      if (event.type.startsWith("touch")) {
        const xVal = xScale(x(selectedData)) || 0;
        const bandwidth = "bandwidth" in xScale ? xScale.bandwidth() : 10;
        hoverX = xVal + bandwidth / 2;
        hoverY = yScale(y(selectedData));
      }

      setHoverState({
        x: hoverX + margin.left,
        y: hoverY + margin.top,
        data: selectedData,
      });
    }
  };

  overlay
    .on("mousemove touchmove touchstart", handleInteraction)
    .on("mouseleave touchend touchcancel", () => {
      bars.style("opacity", 1);
      setHoverState(null);
    });
}
