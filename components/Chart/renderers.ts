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

export function createScales<T>(
  data: T[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  x: (d: T) => any,
  y: (d: T) => number,
  type?: "line" | "area" | "bar",
) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xValues = data.map(x);
  let xScale: any;

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

export function drawGrid(
  g: D3Selection,
  yScale: any,
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

export function drawAxes(
  g: D3Selection,
  xScale: any,
  yScale: any,
  innerWidth: number,
  innerHeight: number,
  margin: { top: number; right: number; bottom: number; left: number },
  config: ChartConfig,
  styles: Record<string, string>,
  isMobile: boolean,
) {
  const tickWidth = 40; // Approx max width of a label "SEPT"
  const maxTicks = Math.floor(innerWidth / tickWidth);

  const axisBottom = d3.axisBottom(xScale);

  // If discrete scale (has domain array), reduce ticks to prevent overlap
  if (xScale.domain && Array.isArray(xScale.domain())) {
    const domain = xScale.domain();
    if (domain.length > maxTicks) {
      const step = Math.ceil(domain.length / maxTicks);
      axisBottom.tickValues(
        domain.filter((_: any, i: number) => i % step === 0),
      );
    }
  } else {
    axisBottom.ticks(Math.min(5, maxTicks));
  }

  const xAxis = g
    .append("g")
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

  // Interaction Overlay
  const overlay = g
    .append("rect")
    .attr("class", "overlay")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .style("fill", "transparent")
    .style("cursor", "crosshair");

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

  const interactionHandler = (event: any) => {
    if (event.type.startsWith("touch")) {
      event.preventDefault();
    }

    const [pointerX, pointerY] = d3.pointer(event);
    let selectedData: T | null = null;

    if (xScale.invert) {
      const x0 = xScale.invert(pointerX);
      const bisect = d3.bisector(x).left;
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];

      if (!d0) {
        selectedData = d1;
      } else if (!d1) {
        selectedData = d0;
      } else {
        const d0Dist = (x0 as number) - (x(d0) as number);
        const d1Dist = (x(d1) as number) - (x0 as number);

        selectedData = d0Dist > d1Dist ? d1 : d0;
      }
    } else {
      const step = xScale.step();
      const index = Math.round(pointerX / step);
      selectedData = data[Math.min(Math.max(0, index), data.length - 1)];
    }

    if (selectedData) {
      const cx = xScale(x(selectedData)) ?? 0;
      const cy = yScale(y(selectedData));

      cursorLine.attr("x1", cx).attr("x2", cx).style("opacity", 1);
      cursorDot.attr("cx", cx).attr("cy", cy).style("opacity", 1);

      setHoverState({
        x: pointerX + margin.left,
        y: pointerY + margin.top,
        data: selectedData,
      });
    }
  };

  overlay
    .on("mousemove touchmove touchstart", interactionHandler)
    .on("mouseleave touchend", () => {
      cursorLine.style("opacity", 0);
      cursorDot.style("opacity", 0);
      setHoverState(null);
    });
}

export function drawBars<T>({
  g,
  data,
  xScale,
  yScale,
  x,
  y,
  innerHeight,
  styles,
  setHoverState,
  margin,
}: DrawContext<T>) {
  const radius = 4; // Matching --radius token

  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("path")
    .attr("class", styles.bar)
    .attr("d", (d) => {
      const xVal = xScale(x(d)) || 0;
      const yVal = yScale(y(d));
      const w = xScale.bandwidth ? xScale.bandwidth() : 10;
      const h = innerHeight - yVal;

      const r = Math.min(radius, w / 2, h);

      return `
        M ${xVal},${yVal + h}
        L ${xVal},${yVal + r}
        A ${r},${r} 0 0 1 ${xVal + r},${yVal}
        L ${xVal + w - r},${yVal}
        A ${r},${r} 0 0 1 ${xVal + w},${yVal + r}
        L ${xVal + w},${yVal + h}
        Z
      `;
    })

    .on("mouseenter mousemove touchstart", (event: any, d) => {
      if (event.type === "touchstart") event.preventDefault();

      const [px, py] = d3Selection.pointer(event, g.node());

      setHoverState({
        x: px + margin.left,
        y: py + margin.top,
        data: d,
      });
    })

    .on("mouseleave touchend", () => setHoverState(null));
}
