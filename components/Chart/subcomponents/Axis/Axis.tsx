"use strict";

import { useEffect, useMemo, useRef } from "react";

import { useChartContext } from "../../context";
import { resolveAccessor } from "../../utils/accessors";
import { d3 } from "../../utils/d3";
import { createScales } from "../../utils/scales";
import styles from "./Axis.module.scss";

export function Axis() {
  const { data, width, height, config, x, y, requestLayoutAdjustment } =
    useChartContext();
  const { margin } = config;
  const gx = useRef<SVGGElement>(null);
  const gy = useRef<SVGGElement>(null);
  const isMobile = false;

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
        requestLayoutAdjustment?.({ left: Math.abs(yBBox.x) + 20 });
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
  }, [ctx, config.hideYAxisDomain, isMobile, requestLayoutAdjustment]);

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
