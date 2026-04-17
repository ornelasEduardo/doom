"use strict";

import { useChartContext } from "../../context";
import styles from "./Grid.module.scss";

export function Grid() {
  const { chartStore, config } = useChartContext();
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const scales = chartStore.useStore((s) => s.scales);

  const { innerWidth, innerHeight } = dimensions;
  const { x: xScale, y: yScale } = scales;

  if (!xScale || !yScale || config.grid === false) {
    return null;
  }

  // Grid lines run perpendicular to the value axis. Pick whichever scale
  // is continuous (has .ticks()) — that's the value axis.
  const yIsContinuous = typeof (yScale as any).ticks === "function";
  const valueScale: any = yIsContinuous ? yScale : xScale;
  const isHorizontalGrid = yIsContinuous;

  if (typeof valueScale.ticks !== "function") {
    return null;
  }

  const ticks = valueScale.ticks(5);

  return (
    <g aria-hidden="true" className={styles.grid}>
      {ticks.map((t: any, i: number) => {
        const pos = valueScale(t);
        return isHorizontalGrid ? (
          <line key={i} x1={0} x2={innerWidth} y1={pos} y2={pos} />
        ) : (
          <line key={i} x1={pos} x2={pos} y1={0} y2={innerHeight} />
        );
      })}
    </g>
  );
}
