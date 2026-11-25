"use strict";

import { useThemeParts } from "../../../../styles/theming/parts";
import { useChartContext } from "../../context";
import { yTickCount } from "../../utils/scales";
import { getAxisTicks } from "../../utils/ticks";
import styles from "./Grid.module.scss";

export function Grid() {
  const doomPart = useThemeParts("Chart", undefined, {});

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
  const { values: ticks } = getAxisTicks<number | Date>(
    numeric,
    horizontal ? innerWidth : dimensions.innerHeight,
    (horizontal ? config.axes?.x : config.axes?.y)?.maxTicks,
    yTickCount(isMobile),
  );

  return (
    <g
      data-chart-grid
      aria-hidden="true"
      {...doomPart("grid", { className: styles.grid })}
    >
      {ticks.map((t, i) =>
        horizontal ? (
          <line
            {...doomPart("gridLine")}
            key={i}
            x1={numeric(t)}
            x2={numeric(t)}
            y1={0}
            y2={dimensions.innerHeight}
          />
        ) : (
          <line
            {...doomPart("gridLine")}
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
