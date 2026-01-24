import clsx from "clsx";
import { useRef } from "react";

import { Card } from "../../../Card/Card";
import { Text } from "../../../Text/Text";
import { useChartContext } from "../../context";
import { useInteraction } from "../../state/store/stores/interaction/interaction.store";
import { useSeries } from "../../state/store/stores/series/series.store";
import { resolveAccessor, Series } from "../../types";
import { HoverInteraction, InteractionType } from "../../types/interaction";
import {
  Reposition,
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
  TOUCH_OFFSET_Y,
} from "../../utils/Reposition";
import styles from "./Tooltip.module.scss";
import { TooltipProps } from "./types";

export function Tooltip<T>({ containerRef, renderTooltip }: TooltipProps<T>) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { x, y, config, variant } = useChartContext<T>();
  const series = useSeries();

  const hover = useInteraction<HoverInteraction<T>>(InteractionType.HOVER);

  const activeData = hover?.target?.data;
  const position = hover?.pointer;

  if (!activeData || !position) {
    return null;
  }

  const { x: newX, y: newY } = new Reposition(tooltipRef.current)
    .anchor(position)
    .gap({ x: TOOLTIP_GAP_X, y: TOOLTIP_GAP_Y })
    .align({ vertical: "center" })
    .touchOffset(TOUCH_OFFSET_Y, position.isTouch ?? false)
    .edgeDetect({ container: containerRef })
    .resolve();

  return (
    <div
      ref={tooltipRef}
      className={styles.tooltipWrapper}
      style={{
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${newX}px, ${newY}px)`,
        zIndex: 10,
      }}
    >
      {renderTooltip ? (
        renderTooltip(activeData)
      ) : (
        <DefaultTooltipContent
          activeData={activeData}
          config={config as any}
          series={series}
          variant={variant}
          x={x}
          y={y}
        />
      )}
    </div>
  );
}

interface DefaultTooltipContentProps<T> {
  activeData: T;
  series: Series[];
  x?: unknown;
  y?: unknown;
  config: { yAxisLabel?: string } & Record<string, unknown>;
  variant?: "default" | "solid";
}

function DefaultTooltipContent<T>({
  activeData,
  series,
  x,
  y,
  config,
  variant,
}: DefaultTooltipContentProps<T>) {
  const xLabel = x ? String(resolveAccessor(x as any)(activeData)) : "Value";

  return (
    <Card
      className={clsx(styles.tooltipCard, variant === "solid" && styles.solid)}
    >
      <Text className={styles.tooltipLabel} variant="h6">
        {xLabel}
      </Text>

      {series.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {series.map((item, i) => (
            <TooltipSeriesItem
              key={i}
              activeData={activeData}
              config={config}
              fallbackY={y}
              series={item}
            />
          ))}
        </div>
      ) : (
        <Text variant="h4">
          {y ? String(resolveAccessor(y as any)(activeData)) : ""}
        </Text>
      )}
    </Card>
  );
}

interface TooltipSeriesItemProps<T> {
  series: Series;
  activeData: T;
  fallbackY?: unknown;
  config: { yAxisLabel?: string } & Record<string, unknown>;
}

function TooltipSeriesItem<T>({
  series,
  activeData,
  fallbackY,
  config,
}: TooltipSeriesItemProps<T>) {
  const accessor = series.yAccessor ? resolveAccessor(series.yAccessor) : null;
  const val = accessor
    ? accessor(activeData)
    : fallbackY
      ? resolveAccessor(fallbackY as any)(activeData)
      : null;

  if (val === null || val === undefined) {
    return null;
  }

  const formattedVal =
    config?.yAxisLabel?.includes("$") || (typeof val === "number" && val > 1000)
      ? `$${val.toLocaleString()}`
      : String(val);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: series.color,
        }}
      />
      <Text style={{ color: "var(--text-secondary)" }} variant="body">
        {series.label}:
      </Text>
      <Text variant="h6">{formattedVal}</Text>
    </div>
  );
}
