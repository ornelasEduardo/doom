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

const limitTicks = <T,>(values: T[], limit: number): T[] => {
  if (values.length <= limit) {
    return values;
  }
  if (limit === 1) {
    return values.slice(0, 1);
  }
  return Array.from(
    { length: limit },
    (_, i) => values[Math.round((i * (values.length - 1)) / (limit - 1))],
  );
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

    const requestedLimit = config.xMaxTicks;
    const maxTicks =
      requestedLimit !== undefined &&
      Number.isFinite(requestedLimit) &&
      requestedLimit >= 1
        ? Math.floor(requestedLimit)
        : undefined;
    // Bound generation before D3 allocates ticks; xMaxTicks is an upper limit,
    // not a request to create more labels than the plot can accommodate.
    const displayBudget = Math.max(1, Math.floor(innerWidth / LABEL_GAP));
    const tickCount =
      maxTicks === undefined
        ? isMobile
          ? 3
          : 5
        : Math.min(maxTicks, displayBudget);
    let values = isContinuousX
      ? (xScale as { ticks: (count: number) => number[] }).ticks(tickCount)
      : (xScale.domain() as (string | number)[]);

    if (isContinuousX) {
      xAxis.ticks(tickCount);
    }
    if (maxTicks !== undefined) {
      values = limitTicks(values, Math.min(maxTicks, displayBudget));
    }
    xAxis.tickValues(values as any);
    if (config.xTickFormat) {
      xAxis.tickFormat((value, index) =>
        config.xTickFormat!(value as string | number, index),
      );
    }
    d3.select(gx.current).call(xAxis);

    if (config.xTickFormat || maxTicks !== undefined) {
      // Capping can leave uneven gaps, so use the rendered positions. A
      // formatter may depend on the tick index; recheck after redrawing.
      while (values.length > 1) {
        let right = -Infinity;
        const labels =
          gx.current.querySelectorAll<SVGTextElement>(".tick text");
        const visible = values.filter((_, index) => {
          const rect = labels[index].getBoundingClientRect();
          if (rect.width === 0) {
            return true;
          }
          if (rect.left < right + LABEL_GAP) {
            return false;
          }
          right = rect.right;
          return true;
        });
        if (visible.length === values.length) {
          break;
        }
        values = visible;
        xAxis.tickValues(values as any);
        d3.select(gx.current).call(xAxis);
      }
    } else if (!isContinuousX) {
      const stride = strideToAvoidOverlap(
        gx.current,
        values.length,
        innerWidth,
      );
      if (stride > 1) {
        xAxis.tickValues(values.filter((_, i) => i % stride === 0) as any);
        d3.select(gx.current).call(xAxis);
      }
    }

    const yAxis = d3.axisLeft(yScale as any).ticks(yTickCount(isMobile));
    if ("ticks" in yScale) {
      yAxis.tickFormat((d) => {
        const val = Number(d);
        if (val === 0) {
          return "0";
        }
        return d3.format(".2s")(val).replace("G", "B");
      });
    }

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
    config.xTickFormat,
    config.xMaxTicks,
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
