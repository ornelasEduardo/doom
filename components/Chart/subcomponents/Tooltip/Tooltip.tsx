"use client";

import clsx from "clsx";
import { useLayoutEffect, useRef, useState } from "react";

import { Card } from "../../../Card/Card";
import { Text } from "../../../Text/Text";
import { TooltipOptions } from "../../behaviors/Tooltip";
import { useChartContext } from "../../context";
import { resolveAccessor, Series } from "../../types";
import { HoverInteraction, InteractionChannel } from "../../types/interaction";
import { barGeometry, categoryAccessor, valueAccessor } from "../../utils/bars";
import { getInteractionKey } from "../../utils/interactionChannels";
import { clipRectToPlot, isPointInPlot } from "../../utils/plotBounds";
import {
  Reposition,
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
} from "../../utils/Reposition";
import { hasDomainOverride } from "../../utils/scales";
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
  const { chartStore } = useChartContext<T>();
  const interactions = chartStore.useStore((s) => s.interactions);
  return [...interactions].flatMap(([key, value]) =>
    typeof key === "string" &&
    key.startsWith(`${InteractionChannel.TOOLTIP_CONFIG}:`) ? (
      <TooltipInstance<T>
        key={key}
        containerRef={containerRef}
        tooltipConfig={value as TooltipOptions<T>}
      />
    ) : (
      []
    ),
  );
}

function TooltipInstance<T>({
  containerRef,
  tooltipConfig,
}: Omit<TooltipProps<T>, "renderTooltip"> & {
  tooltipConfig: TooltipOptions<T>;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { chartStore, engine, x, y, config, variant } = useChartContext<T>();

  const dimensions = chartStore.useStore((s) => s.dimensions);
  const series = chartStore.useStore((s) => s.processedSeries);
  const interactions = chartStore.useStore((s) => s.interactions);

  const interactionType = tooltipConfig?.on || InteractionChannel.PRIMARY_HOVER;
  const hover = interactions.get(
    getInteractionKey(interactionType),
  ) as HoverInteraction<T>;

  // Anchor the overlay to the first target while preserving the complete target set.
  const target = hover?.targets?.[0] ?? null;
  const position = hover?.pointer;

  const [layout, setLayout] = useState<{
    x: number;
    y: number;
    visible: boolean;
    pointer?: HoverInteraction<T>["pointer"];
  }>({ x: 0, y: 0, visible: false });

  useLayoutEffect(() => {
    if (!tooltipRef.current || !target || !position) {
      return;
    }

    // Measure after the DOM commit so a moved header or plot is included,
    // even when the keyboard selection itself has not changed.
    let pointer = position;
    if (hover.anchor === "target") {
      const x = target.coordinate.x - dimensions.margin.left;
      const y = target.coordinate.y - dimensions.margin.top;
      const container = engine.resolveContainerCoordinates(x, y);
      pointer = {
        ...position,
        x,
        y,
        containerX: container.x,
        containerY: container.y,
      };
    }
    const { x, y } = new Reposition(tooltipRef.current)
      .anchor({
        x: pointer.containerX,
        y: pointer.containerY,
      })
      .gap({ x: TOOLTIP_GAP_X, y: TOOLTIP_GAP_Y })
      .align({ vertical: "center" })
      .edgeDetect({ container: containerRef })
      .resolve();

    setLayout((previous) => {
      const before = previous.pointer;
      if (
        previous.visible &&
        previous.x === x &&
        previous.y === y &&
        before?.x === pointer.x &&
        before.y === pointer.y &&
        before.containerX === pointer.containerX &&
        before.containerY === pointer.containerY &&
        before.isTouch === pointer.isTouch
      ) {
        return previous;
      }
      return { x, y, visible: true, pointer };
    });
  }, [
    target,
    position,
    hover?.anchor,
    dimensions,
    engine,
    containerRef,
    config,
    series,
  ]);

  if (!target || !position) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      data-chart-tooltip
      className={styles.tooltipWrapper}
      style={{
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${layout.x}px, ${layout.y}px)`,
        zIndex: "var(--z-tooltip)",
        opacity: layout.visible ? 1 : 0,
      }}
    >
      {tooltipConfig?.render ? (
        tooltipConfig.render({
          data: hover.targets.map((item) => item.data),
          targets: hover.targets,
          pointer: layout.pointer ?? position,
        })
      ) : (
        <DefaultTooltipContent
          activeData={target.data}
          activeSeriesId={target.seriesId}
          config={config as any}
          series={series}
          targets={hover.targets}
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
  activeSeriesId?: string;
  targets?: HoverInteraction<T>["targets"];
  series: Series[];
  x?: unknown;
  y?: unknown;
  config: { yAxisLabel?: string } & Record<string, unknown>;
  variant?: "default" | "solid";
}

function DefaultTooltipContent<T>({
  activeData,
  activeSeriesId,
  targets,
  series,
  x,
  y,
  config,
  variant,
}: DefaultTooltipContentProps<T>) {
  const { chartStore } = useChartContext<T>();
  const scales = chartStore.useStore((state) => state.scales);
  const dimensions = chartStore.useStore((state) => state.dimensions);
  const bounded = chartStore.useStore(
    (state) =>
      hasDomainOverride(state.scales.x, state.xDomain) ||
      hasDomainOverride(state.scales.y, state.yDomain),
  );
  const activeSeries = series.find((item) => item.id === activeSeriesId);
  const category = activeSeries ? categoryAccessor(activeSeries) : x;
  const categoryValue = category
    ? resolveAccessor(category as any)(activeData)
    : undefined;
  const xLabel = category ? String(categoryValue) : "Value";
  const hasIdentifiedTargets = targets?.some(
    (target) => target.seriesId !== undefined,
  );

  return (
    <Card
      className={clsx(styles.tooltipCard, variant === "solid" && styles.solid)}
    >
      <Text as="p" className={styles.tooltipLabel} variant="h6">
        {xLabel}
      </Text>

      {series.length > 0 && hasIdentifiedTargets ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {series.map((item, i) => {
            const candidate = targets?.find(
              (target) => target.seriesId === item.id,
            );
            if (!candidate) {
              return null;
            }
            const datum = candidate.data;
            if (datum === undefined) {
              return null;
            }
            if (bounded && scales.x && scales.y) {
              const bar =
                item.type === "bar"
                  ? barGeometry(
                      item,
                      datum,
                      item.data?.indexOf(datum) ?? -1,
                      scales.x,
                      scales.y,
                    )
                  : null;
              const visible = bar
                ? !!clipRectToPlot(bar, dimensions)
                : isPointInPlot(
                    {
                      x: (scales.x as (value: unknown) => number)(
                        item.xAccessor
                          ? resolveAccessor(item.xAccessor)(datum)
                          : undefined,
                      ),
                      y: (scales.y as (value: unknown) => number)(
                        item.yAccessor
                          ? resolveAccessor(item.yAccessor)(datum)
                          : undefined,
                      ),
                    },
                    dimensions,
                  );
              if (!visible) {
                return null;
              }
            }
            return (
              <TooltipSeriesItem
                key={i}
                activeData={datum}
                config={config}
                fallbackY={y}
                series={item}
              />
            );
          })}
        </div>
      ) : (
        <Text as="p" variant="h4">
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
  const value = valueAccessor(series);
  const accessor = value ? resolveAccessor(value) : null;
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
      <Text style={{ color: "var(--muted-foreground)" }} variant="body">
        {series.label}:
      </Text>
      <Text as="p" variant="h6">
        {formattedVal}
      </Text>
    </div>
  );
}
