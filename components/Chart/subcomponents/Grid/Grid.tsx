"use strict";

import { useChartContext } from "../../context";
import { yTickCount } from "../../utils/scales";
import styles from "./Grid.module.scss";

export function Grid() {
  const { chartStore, config, isMobile } = useChartContext();
  const dimensions = chartStore.useStore((s) => s.dimensions);
  const scales = chartStore.useStore((s) => s.scales);

  const { innerWidth } = dimensions;
  const { y: yScale } = scales;

  if (!yScale || config.grid === false) {
    return null;
  }

  const horizontal = !("ticks" in yScale);
  const numeric = horizontal ? scales.x : yScale;
  if (!numeric || !("ticks" in numeric)) {
    return null;
  }
  const ticks = numeric.ticks(yTickCount(isMobile));

  return (
    <g data-chart-grid aria-hidden="true" className={styles.grid}>
      {ticks.map((t: any, i: number) =>
        horizontal ? (
          <line
            key={i}
            x1={numeric(t)}
            x2={numeric(t)}
            y1={0}
            y2={dimensions.innerHeight}
          />
        ) : (
          <line
            key={i}
            x1={0}
            x2={innerWidth}
            y1={numeric(t)}
            y2={numeric(t)}
          />
        ),
      )}
    </g>
  );
}
