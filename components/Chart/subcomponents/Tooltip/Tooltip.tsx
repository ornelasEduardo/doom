"use client";

import clsx from "clsx";
import { useLayoutEffect, useRef, useState } from "react";

import { Card } from "../../../Card/Card";
import { Text } from "../../../Text/Text";
import { TooltipOptions } from "../../behaviors/Tooltip";
import { useChartContext } from "../../context";
import { resolveAccessor, Series } from "../../types";
import { HoverInteraction, InteractionChannel } from "../../types/interaction";
import {
  Reposition,
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
} from "../../utils/Reposition";
import styles from "./Tooltip.module.scss";
import { TooltipProps } from "./types";

/**
 * The Tooltip component is a pure reactor that renders the chart's tooltip.
 * It reads its configuration and active data from the interaction store and
 * uses the `Reposition` utility for viewport-aware placement.
 *
 * It supports both the default Doom styling and custom renderers provided via
 * the `Tooltip` behavior.
 */
export function Tooltip<T>({
  containerRef,
}: Omit<TooltipProps<T>, "renderTooltip">) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { chartStore, x, y, config, variant } = useChartContext<T>();

  const series = chartStore.useStore((s) => s.processedSeries);
  const interactions = chartStore.useStore((s) => s.interactions);

  const tooltipConfig = interactions.get(
    InteractionChannel.TOOLTIP_CONFIG,
  ) as TooltipOptions<T>;

  const interactionType = tooltipConfig?.on || InteractionChannel.PRIMARY_HOVER;
  const hover = interactions.get(interactionType) as HoverInteraction<T>;

  // Use primary target for positioning, but pass all targets or primary data to renderer
  const target = hover?.targets?.[0] ?? null;
  const position = hover?.pointer;

  const [layout, setLayout] = useState({ x: 0, y: 0, visible: false });

  useLayoutEffect(() => {
    if (!tooltipRef.current || !target || !position) {
      return;
    }

    const offsetParent = tooltipRef.current.offsetParent as HTMLElement;
    if (!offsetParent) {
      return;
    }

    const style = window.getComputedStyle(offsetParent);
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;

    const { x, y } = new Reposition(tooltipRef.current)
      .anchor({
        x:
          ((position as { containerX?: number }).containerX ?? position.x) -
          borderLeft,
        y:
          ((position as { containerY?: number }).containerY ?? position.y) -
          borderTop,
      })
      .gap({ x: TOOLTIP_GAP_X, y: TOOLTIP_GAP_Y })
      .align({ vertical: "center" })
      .edgeDetect({ container: { current: offsetParent } })
      .resolve();

    setLayout({ x, y, visible: true });
  }, [target, position, containerRef]);

  if (!target || !position) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      className={styles.tooltipWrapper}
      style={{
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${layout.x}px, ${layout.y}px)`,
        zIndex: 10,
        opacity: layout.visible ? 1 : 0,
        transition: "opacity 0.1s ease-out",
      }}
    >
      {tooltipConfig?.render ? (
        tooltipConfig.render(
          (hover.targets && hover.targets.length > 1
            ? hover.targets.map((t) => t.data)
            : target.data) as any,
        )
      ) : (
        <DefaultTooltipContent
          activeData={target.data}
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
