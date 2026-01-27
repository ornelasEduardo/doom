"use strict";

import { useChartContext } from "../../context";
import styles from "./Grid.module.scss";

export function Grid() {
  const { chartStore, config } = useChartContext();
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const scales = chartStore.useStore((s) => s.scales);

  const { innerWidth } = dimensions;
  const { y: yScale } = scales;

  if (!yScale || config.grid === false) {
    return null;
  }

  const ticks = yScale.ticks(5);

  return (
    <g aria-hidden="true" className={styles.grid}>
      {ticks.map((t: any, i: number) => (
        <line key={i} x1={0} x2={innerWidth} y1={yScale(t)} y2={yScale(t)} />
      ))}
    </g>
  );
}
