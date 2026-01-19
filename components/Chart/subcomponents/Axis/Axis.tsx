"use strict";

import { useEffect, useMemo, useRef } from "react";

import { useChartContext } from "../../context";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";
import styles from "./Axis.module.scss";

export function Axis() {
  const { data, width, height, config, x, y } = useChartContext();
  const { margin } = config;
  const gx = useRef<SVGGElement>(null);
  const gy = useRef<SVGGElement>(null);
  const isMobile = false; // TODO: Context or hook

  const ctx = useMemo(() => {
    if (
      !data.length ||
      !x ||
      !y ||
      !config.showAxes ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }
    return createScales(
      data,
      width,
      height,
      margin,
      resolveAccessor(x),
      resolveAccessor(y),
      config.type as any,
    );
  }, [data, width, height, margin, x, y, config.type]);

  useEffect(() => {
    if (!ctx || !gx.current || !gy.current) {
      return;
    }
    const { xScale, yScale, innerWidth, innerHeight } = ctx;

    // X Axis
    const xAxis = d3.axisBottom(xScale as any);
    if ("bandwidth" in xScale) {
      // Band scale logic (omit ticks if too many?)
      xAxis.ticks(5);
    } else {
      xAxis.ticks(5);
    }

    d3.select(gx.current).call(xAxis);

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(isMobile ? 3 : 5);
    // Format logic from renderers.ts
    yAxis.tickFormat((d) => {
      const val = typeof d === "number" ? d : d.valueOf();
      if (val === 0) {
        return "0";
      }
      return d3.format(".2s")(val).replace("G", "B");
    });

    d3.select(gy.current).call(yAxis);

    // Custom styling from renderers.ts
    d3.select(gy.current)
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("x", -8)
      .attr("dy", "0.32em");

    // Hide domain?
    if (config.hideYAxisDomain) {
      d3.select(gy.current).select(".domain").remove();
    }
  }, [ctx, config.hideYAxisDomain, isMobile]);

  if (!ctx) {
    return null;
  }

  const { innerWidth, innerHeight } = ctx;

  return (
    <g
      className={styles.axes}
      transform={`translate(${margin.left}, ${margin.top})`}
    >
      <g ref={gx} transform={`translate(0, ${innerHeight})`} />
      <g ref={gy} />
      {config.xAxisLabel && (
        <text
          className={styles.label}
          style={{ textAnchor: "middle" }}
          transform={`translate(${innerWidth / 2}, ${innerHeight + 40})`} // Bottom center
        >
          {config.xAxisLabel}
        </text>
      )}
      {config.yAxisLabel && (
        <text
          className={styles.label}
          style={{ textAnchor: "middle" }}
          transform={`rotate(-90)`}
          x={-innerHeight / 2} // Centered vertically (rotated)
          y={-margin.left + 20} // Left of axis
        >
          {config.yAxisLabel}
        </text>
      )}
    </g>
  );
}
