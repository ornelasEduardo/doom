"use strict";

import { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { d3 } from "../../utils/d3";
import { yTickCount } from "../../utils/scales";
import styles from "./Axis.module.scss";

const X_LABEL_OFFSET = 40;

/** Minimum clear space between neighbouring tick labels. */
const LABEL_GAP = 8;

/**
 * How many categories to skip so tick labels stop colliding.
 *
 * Band and point scales ignore d3's tick count, so every category is drawn.
 * Measured rather than budgeted: a fixed budget would also thin charts with
 * room to spare.
 */
const strideToAvoidOverlap = (
  group: SVGGElement,
  categories: number,
  innerWidth: number,
): number => {
  if (categories < 2 || innerWidth <= 0) {
    return 1;
  }

  let widest = 0;
  group.querySelectorAll<SVGTextElement>(".tick text").forEach((label) => {
    try {
      widest = Math.max(widest, label.getBBox().width);
    } catch {
      // Not laid out (no layout engine): fall through to keeping every label.
    }
  });

  if (widest === 0) {
    return 1;
  }

  const step = innerWidth / categories;
  return Math.max(1, Math.ceil((widest + LABEL_GAP) / step));
};

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
    const isContinuousX = typeof (xScale as any).ticks === "function";

    if (isContinuousX) {
      xAxis.ticks(isMobile ? 3 : 5);
    }

    d3.select(gx.current).call(xAxis);

    if (!isContinuousX) {
      // Draw every category first, then thin only if they actually collide.
      const domain = (xScale as any).domain() as (string | number)[];
      const stride = strideToAvoidOverlap(
        gx.current,
        domain.length,
        innerWidth,
      );

      if (stride > 1) {
        xAxis.tickValues(domain.filter((_, i) => i % stride === 0) as any);
        d3.select(gx.current).call(xAxis);
      }
    }

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
