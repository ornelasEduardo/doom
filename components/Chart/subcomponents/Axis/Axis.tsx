"use strict";

import { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { d3 } from "../../utils/d3";
import { yTickCount } from "../../utils/scales";
import styles from "./Axis.module.scss";

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

    const xAxis = d3.axisBottom(xScale as any);
    const xTickCount = isMobile ? 3 : 5;

    if (typeof (xScale as any).ticks === "function") {
      xAxis.ticks(xTickCount);
    } else {
      // Band and point scales have no .ticks(), so d3 ignores the count and
      // draws one label per category — 30 categories meant 30 overlapping
      // labels. Thin the domain to roughly the same budget instead.
      const domain = (xScale as any).domain() as (string | number)[];
      const stride = Math.max(1, Math.ceil(domain.length / xTickCount));
      xAxis.tickValues(domain.filter((_, i) => i % stride === 0) as any);
    }

    d3.select(gx.current).call(xAxis);

    const yAxis = d3.axisLeft(yScale).ticks(yTickCount(isMobile));
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
      const tickOverflow = xBBox.y + xBBox.height - innerHeight;

      // The x-axis label lives outside gx — it is a sibling <text> offset below
      // the plot — so the tick group's own box never accounts for it, and the
      // bottom margin was left too small. The svg is overflow:hidden by spec,
      // so the shortfall clipped the label's descenders rather than spilling.
      // getBBox reports the text's own coordinate space, before the translate
      // that positions it below the plot, so the offset has to be added back.
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
