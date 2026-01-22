"use client";

import { useRef } from "react";

import { Card } from "../../../Card/Card";
import { Text } from "../../../Text/Text";
import { useChartContext } from "../../context";
import { LegendItem, resolveAccessor } from "../../types";
import {
  Reposition,
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
  TOUCH_OFFSET_Y,
} from "../../utils/Reposition";
import styles from "./Tooltip.module.scss";
import { TooltipProps } from "./types";

export function Tooltip<T>({
  activeData,
  position,
  containerRef,
  renderTooltip,
}: TooltipProps<T>) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { legendItems, x, y, config } = useChartContext<T>();

  if (!activeData || !position) {
    return null;
  }

  // Calculate position using Reposition utility
  const { x: newX, y: newY } = new Reposition(tooltipRef.current)
    .anchor(position)
    .gap({ x: TOOLTIP_GAP_X, y: TOOLTIP_GAP_Y })
    .align({ vertical: "center" }) // Center vertically on data point
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
          legendItems={legendItems}
          x={x}
          y={y}
        />
      )}
    </div>
  );
}

// =============================================================================
// Default Tooltip Content
// =============================================================================

interface DefaultTooltipContentProps<T> {
  activeData: T;
  legendItems: LegendItem[];
  x?: unknown;
  y?: unknown;
  config: { yAxisLabel?: string } & Record<string, unknown>;
}

function DefaultTooltipContent<T>({
  activeData,
  legendItems,
  x,
  y,
  config,
}: DefaultTooltipContentProps<T>) {
  const xLabel = x ? String(resolveAccessor(x as any)(activeData)) : "Value";

  return (
    <Card className={styles.tooltipCard}>
      <Text className={styles.tooltipLabel} variant="h6">
        {xLabel}
      </Text>

      {legendItems.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {legendItems.map((item, i) => (
            <TooltipLegendItem
              key={i}
              activeData={activeData}
              config={config}
              fallbackY={y}
              item={item}
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

// =============================================================================
// Tooltip Legend Item
// =============================================================================

interface TooltipLegendItemProps<T> {
  item: LegendItem;
  activeData: T;
  fallbackY?: unknown;
  config: { yAxisLabel?: string } & Record<string, unknown>;
}

function TooltipLegendItem<T>({
  item,
  activeData,
  fallbackY,
  config,
}: TooltipLegendItemProps<T>) {
  const accessor = item.yAccessor ? resolveAccessor(item.yAccessor) : null;
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
          backgroundColor: item.color,
        }}
      />
      <Text style={{ color: "var(--text-secondary)" }} variant="body">
        {item.label}:
      </Text>
      <Text variant="h6">{formattedVal}</Text>
    </div>
  );
}
