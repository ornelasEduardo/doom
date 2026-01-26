"use strict";

import { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { d3 } from "../../utils/d3";
import styles from "./Axis.module.scss";

export function Axis() {
  const { chartStore, config, requestLayoutAdjustment, isMobile } =
    useChartContext();
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const scales = chartStore.useStore((s) => s.scales);

  const { margin, innerWidth, innerHeight } = dimensions;
  const { x: xScale, y: yScale } = scales;

  const gx = useRef<SVGGElement>(null);
  const gy = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!xScale || !yScale || !gx.current || !gy.current) {
      return;
    }

    const xAxis = d3.axisBottom(xScale as any);
    if ("bandwidth" in xScale) {
      xAxis.ticks(5);
    } else {
      xAxis.ticks(5);
    }

    d3.select(gx.current).call(xAxis);

    const yAxis = d3.axisLeft(yScale).ticks(isMobile ? 3 : 5);
    yAxis.tickFormat((d) => {
      const val = typeof d === "number" ? d : d.valueOf();
      if (val === 0) {
        return "0";
      }
      return d3.format(".2s")(val).replace("G", "B");
    });

    d3.select(gy.current).call(yAxis);

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
      if (xBBox.y + xBBox.height > innerHeight) {
        requestLayoutAdjustment?.({
          bottom: Math.abs(xBBox.y + xBBox.height - innerHeight) + 20,
        });
      }
    } catch {
      // Ignore measurement errors if SVG not in DOM
    }
  }, [
    xScale,
    yScale,
    config.hideYAxisDomain,
    config.yAxisLabel,
    isMobile,
    requestLayoutAdjustment,
    innerHeight,
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
          className={styles.label}
          style={{ textAnchor: "middle" }}
          transform={`translate(${innerWidth / 2}, ${innerHeight + 40})`}
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
