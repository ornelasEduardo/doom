"use client";

import { useEffect, useRef } from "react";

import { CHART_DATA_ATTRS } from "../engine";
import styles from "../subcomponents/SeriesPoint/SeriesPoint.module.scss";
import { registerGpuMark } from "./scene";

export interface GpuPointCloudProps {
  positions: Float32Array;
  radii: Float32Array;
  dataIndices: Int32Array;
  dataAt?: (slot: number) => unknown;
  seriesId: string;
  seriesColor: string;
  label?: string;
}

/** Built-in scatter interaction identities remain owned by Root's spatial index. */
export function GpuPointCloud({
  positions,
  radii,
  dataIndices,
  dataAt,
  seriesId,
  seriesColor,
  label = "Scatter Series",
}: GpuPointCloudProps) {
  const group = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!group.current || !radii.length) {
      return;
    }
    return registerGpuMark(group.current, {
      kind: "cloud",
      positions,
      radii,
      dataIndices,
      dataAt,
      seriesId,
      radius: 6,
    });
  }, [positions, radii, dataIndices, dataAt, seriesId]);

  return (
    <g
      ref={group}
      aria-label={`${label}: ${radii.length} data points`}
      aria-roledescription="scatter plot"
      className={styles.point}
      data-chart-gpu-mark="cloud"
      role="graphics-object"
      style={{ fill: seriesColor }}
      {...{
        [CHART_DATA_ATTRS.TYPE]: "scatter",
        [CHART_DATA_ATTRS.SERIES_ID]: seriesId,
        [CHART_DATA_ATTRS.DRAGGABLE]: false,
      }}
    >
      <circle data-chart-gpu-selector-proxy="" r={0} />
    </g>
  );
}
