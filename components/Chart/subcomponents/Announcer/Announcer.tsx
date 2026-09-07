"use client";

import React from "react";

import { useChartContext } from "../../context";
import { resolveAccessor } from "../../types/accessors";
import { HoverInteraction, InteractionChannel } from "../../types/interaction";
import { categoryAccessor, valueAccessor } from "../../utils/bars";
import { describeDatum } from "../../utils/describe";
import styles from "./Announcer.module.scss";

interface AnnouncerProps {
  /** Id the chart region points its aria-describedby at. */
  summaryId: string;
}

const describe = (value: unknown) =>
  value instanceof Date ? value.toLocaleDateString() : String(value);

/**
 * Announcer
 *
 * The chart's text channel for assistive technology. The plot itself is an
 * aria-hidden SVG, so without this a screen reader gets the region's name and
 * nothing about the data.
 *
 * Renders a hidden summary, referenced by the region's aria-describedby, and a
 * live region reporting the focused point.
 *
 * Subscribes to the store itself so hovering re-renders only this component.
 */
export const Announcer: React.FC<AnnouncerProps> = ({ summaryId }) => {
  const { chartStore } = useChartContext();

  const data = chartStore.useStore((s) => s.data);
  const type = chartStore.useStore((s) => s.type);
  const config = chartStore.useStore((s) => s.config);
  const xAccessor = chartStore.useStore((s) => s.x);
  const yAccessor = chartStore.useStore((s) => s.y);
  const hover = chartStore.useStore((s) =>
    s.interactions.get(InteractionChannel.PRIMARY_HOVER),
  ) as HoverInteraction | undefined;

  const series = chartStore.useStore((s) => s.processedSeries);
  const horizontal = series[0]?.orientation === "horizontal";

  const getX = xAccessor ? resolveAccessor(xAccessor) : null;
  const getY = yAccessor ? resolveAccessor(yAccessor) : null;

  const summary = React.useMemo(() => {
    if (!data?.length || !getX || !getY) {
      return "Empty chart.";
    }

    const xLabel = config?.xAxisLabel || "X";
    const yLabel = config?.yAxisLabel || "Y";
    const xValues = data.map((d) => getX(d));
    if (horizontal) {
      const values = xValues.map(Number).filter(Number.isFinite);
      const categories = data.map((d) => getY(d));
      return `${type || "Bar"} chart with ${data.length} data points. ${xLabel} from ${Math.min(...values)} to ${Math.max(...values)}. ${yLabel} from ${describe(categories[0])} to ${describe(categories[categories.length - 1])}.`;
    }
    const yValues = data.map((d) => Number(getY(d))).filter(Number.isFinite);

    const parts = [
      `${type || "Line"} chart with ${data.length} data points.`,
      `${xLabel} from ${describe(xValues[0])} to ${describe(xValues[xValues.length - 1])}.`,
    ];

    if (yValues.length) {
      parts.push(
        `${yLabel} from ${Math.min(...yValues)} to ${Math.max(...yValues)}.`,
      );
    }

    return parts.join(" ");
    // getX/getY are derived from the accessors, which are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, type, config, xAccessor, yAccessor, horizontal]);

  const active = React.useMemo(() => {
    return (hover?.targets ?? [])
      .map((target) => {
        const item = series.find((item) => item.id === target.seriesId);
        const horizontal = item?.orientation === "horizontal";
        const formatted = (accessor: typeof xAccessor, axis: "x" | "y") =>
          accessor
            ? (datum: unknown) => {
                const value = resolveAccessor(accessor)(datum);
                const format = config.axes?.[axis]?.tickFormat;
                return format &&
                  (typeof value === "string" || typeof value === "number")
                  ? format(value, target.dataIndex ?? 0)
                  : value;
              }
            : undefined;
        const reading = describeDatum(
          target.data,
          formatted(
            item ? categoryAccessor(item) : xAccessor,
            horizontal ? "y" : "x",
          ),
          formatted(
            item ? valueAccessor(item) : yAccessor,
            horizontal ? "x" : "y",
          ),
        );
        return reading && item?.label ? `${item.label}: ${reading}` : reading;
      })
      .filter(Boolean)
      .join(". ");
  }, [hover, xAccessor, yAccessor, series, config]);

  return (
    <>
      <div className={styles.srOnly} id={summaryId}>
        {summary}
      </div>
      <div aria-live="polite" className={styles.srOnly} role="status">
        {active}
      </div>
    </>
  );
};
