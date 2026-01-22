"use client";

import React, { useEffect, useRef } from "react";

import { useChartContext } from "../../context";
import styles from "../Root/Root.module.scss";

export interface PlotProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Plot({ children, className, style }: PlotProps) {
  const { setWidth, setHeight, setPlotRef } = useChartContext();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      setPlotRef?.(wrapperRef.current);
    }
  }, [setPlotRef]);
  const [localWidth, setLocalWidth] = React.useState(0);
  const [localHeight, setLocalHeight] = React.useState(0);

  useEffect(() => {
    if (!wrapperRef.current) {
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
        setLocalWidth(w);
        setLocalHeight(h);

        // Update context if setters are available
        if (setWidth) {
          setWidth(w);
        }
        if (setHeight) {
          setHeight(h);
        }
      }
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [setWidth, setHeight]);

  return (
    <div
      ref={wrapperRef}
      className={`${styles.responsiveWrapper} ${className || ""}`}
      style={{ flex: 1, position: "relative", minHeight: 0, ...style }}
    >
      {localWidth > 0 && localHeight > 0 && (
        <svg
          className="chart-plot"
          height={localHeight}
          style={{ overflow: "visible" }}
          width={localWidth}
        >
          {children}
        </svg>
      )}
    </div>
  );
}
