"use client";

import React, { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import { updateChartDimensions } from "../../state/store/chart.store";
import styles from "../Root/Root.module.scss";

export interface PlotProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Plot({ children, className, style }: PlotProps) {
  const { chartStore } = useChartContext();
  const dimensions = chartStore.useStore((s) => s.dimensions);

  const svgRef = useRef<SVGSVGElement>(null);
  const plotRef = useRef<SVGGElement>(null);

  useEffect(() => {
    chartStore.setState((prev) => ({
      elements: {
        ...prev.elements,
        svg: svgRef.current,
        plot: plotRef.current,
      },
    }));
  }, [chartStore]);

  useEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let w = 0;
        let h = 0;
        if (entry.contentBoxSize) {
          w = entry.contentBoxSize[0].inlineSize;
          h = entry.contentBoxSize[0].blockSize;
        } else {
          w = entry.contentRect.width;
          h = entry.contentRect.height;
        }
        updateChartDimensions(chartStore, w, h);
      }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [chartStore]);

  if (dimensions.width <= 0) {
    return null;
  }

  return (
    <div
      className={`${styles.responsiveWrapper} ${className || ""}`}
      style={{ flex: 1, position: "relative", minHeight: 0, ...style }}
    >
      <svg
        ref={svgRef}
        data-chart-plot
        className="chart-plot"
        height={dimensions.height}
        style={{ overflow: "visible" }}
        width={dimensions.width}
      >
        <g
          ref={plotRef}
          data-chart-inner-plot
          transform={`translate(${dimensions.margin.left}, ${dimensions.margin.top})`}
        >
          <rect
            fill="transparent"
            height={dimensions.innerHeight}
            width={dimensions.innerWidth}
          />
        </g>
        {children}
      </svg>
    </div>
  );
}
