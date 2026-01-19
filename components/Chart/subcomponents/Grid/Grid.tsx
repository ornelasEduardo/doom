"use strict";

import { useMemo } from "react";

import { useChartContext } from "../../context";
import { resolveAccessor } from "../../utils/accessors";
import { createScales } from "../../utils/scales";
import styles from "./Grid.module.scss";

export function Grid() {
  const { data, width, height, config, y } = useChartContext();
  const { margin } = config;

  const ctx = useMemo(() => {
    if (!data.length || width <= 0 || height <= 0 || !y || !config.grid) {
      return null;
    }
    return createScales(
      data,
      width,
      height,
      margin,
      () => 0,
      resolveAccessor(y),
    );
  }, [data, width, height, margin, y]);

  if (!ctx) {
    return null;
  }
  const { yScale, innerWidth } = ctx;

  const ticks = yScale.ticks(5);

  return (
    <g
      className={styles.grid}
      transform={`translate(${margin.left}, ${margin.top})`}
    >
      {ticks.map((t, i) => (
        <line key={i} x1={0} x2={innerWidth} y1={yScale(t)} y2={yScale(t)} />
      ))}
    </g>
  );
}
