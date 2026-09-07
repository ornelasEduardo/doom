"use strict";

import type { AxisScale } from "d3-axis";
import { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { d3 } from "../../utils/d3";
import { yTickCount } from "../../utils/scales";
import styles from "./Axis.module.scss";
import { renderAxisTicks } from "./axisTicks";

const X_LABEL_OFFSET = 40;

export function Axis() {
  const { chartStore, config, requestLayoutAdjustment, isMobile } =
    useChartContext();
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const scales = chartStore.useStore((s) => s.scales);

  const { margin, innerWidth, innerHeight } = dimensions;
  const { x: xScale, y: yScale } = scales;

  const gx = useRef<SVGGElement>(null);
  const xLabelRef = useRef<SVGTextElement>(null);
  const gy = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!xScale || !yScale || !gx.current || !gy.current) {
      return;
    }

    const xAxis = d3.axisBottom(xScale as AxisScale<string | number>);
    const yAxis = d3.axisLeft(yScale as AxisScale<string | number>);
    renderAxisTicks(gx.current, xAxis, {
      direction: "x",
      length: innerWidth,
      options: config.axes?.x,
      defaultTickCount: isMobile ? 3 : 5,
    });
    renderAxisTicks(gy.current, yAxis, {
      direction: "y",
      length: innerHeight,
      options: config.axes?.y,
      defaultTickCount: yTickCount(isMobile),
      defaultTickFormat:
        "ticks" in yScale
          ? (value) => {
              const val = Number(value);
              return val === 0 ? "0" : d3.format(".2s")(val).replace("G", "B");
            }
          : undefined,
    });

    d3.select(gy.current)
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("x", -8)
      .attr("dy", "0.32em");

    if (config.hideYAxisDomain) {
      d3.select(gy.current).select(".domain").remove();
    }

    try {
      const yBBox = gy.current.getBBox();
      if (yBBox.x < 0) {
        const padding = config.yAxisLabel ? 50 : 20;
        requestLayoutAdjustment?.({ left: Math.abs(yBBox.x) + padding });
      }

      const xBBox = gx.current.getBBox();
      const tickOverflow = xBBox.y + xBBox.height - innerHeight;

      // The axis label is a sibling <text> below the plot, so gx's box never
      // covers it. The svg is overflow:hidden, so anything unaccounted for is
      // clipped rather than spilling visibly.
      // getBBox reports the text's own coordinate space, before the translate
      // that positions it, so the offset has to be added back.
      const labelBox = xLabelRef.current?.getBBox();
      const labelOverflow = labelBox
        ? X_LABEL_OFFSET + labelBox.y + labelBox.height
        : 0;

      const overflow = Math.max(tickOverflow, labelOverflow);
      if (overflow > 0) {
        requestLayoutAdjustment?.({ bottom: overflow + 20 });
      }
    } catch {
      // Ignore measurement errors if SVG not in DOM
    }
  }, [
    xScale,
    yScale,
    config.hideYAxisDomain,
    config.yAxisLabel,
    config.xAxisLabel,
    config.axes?.x?.tickFormat,
    config.axes?.x?.valueFormat,
    config.axes?.x?.maxTicks,
    config.axes?.y?.tickFormat,
    config.axes?.y?.valueFormat,
    config.axes?.y?.maxTicks,
    isMobile,
    requestLayoutAdjustment,
    innerHeight,
    innerWidth,
  ]);

  if (!xScale || !yScale) {
    return null;
  }

  return (
    <g aria-hidden="true" className={styles.axes}>
      <g
        ref={gx}
        aria-label="X Axis"
        transform={`translate(0, ${innerHeight})`}
      />
      <g ref={gy} aria-label="Y Axis" />
      {config.xAxisLabel && (
        <text
          ref={xLabelRef}
          className={styles.label}
          style={{ textAnchor: "middle" }}
          transform={`translate(${innerWidth / 2}, ${innerHeight + X_LABEL_OFFSET})`}
        >
          {config.xAxisLabel}
        </text>
      )}
      {config.yAxisLabel && (
        <text
          className={styles.label}
          style={{ textAnchor: "middle" }}
          transform={`rotate(-90)`}
          x={-innerHeight / 2}
          y={-margin.left + 20}
        >
          {config.yAxisLabel}
        </text>
      )}
    </g>
  );
}
