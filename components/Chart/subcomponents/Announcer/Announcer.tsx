import React from "react";

import { useChartContext } from "../../context";
import { resolveAccessor } from "../../types/accessors";
import { InteractionChannel } from "../../types/interaction";
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
 * Renders two things, both visually hidden:
 * - a static summary of the series, referenced by the region's aria-describedby
 * - a live region that reports the focused point as the user moves through the
 *   chart with a pointer or the arrow keys
 *
 * It subscribes to the store itself so that hovering re-renders only this
 * component rather than the whole chart.
 */
export const Announcer: React.FC<AnnouncerProps> = ({ summaryId }) => {
  const { chartStore } = useChartContext();

  const data = chartStore.useStore((s: any) => s.data) as any[];
  const type = chartStore.useStore((s: any) => s.type) as string;
  const config = chartStore.useStore((s: any) => s.config) as any;
  const xAccessor = chartStore.useStore((s: any) => s.x);
  const yAccessor = chartStore.useStore((s: any) => s.y);
  const hover = chartStore.useStore((s: any) =>
    s.interactions.get(InteractionChannel.PRIMARY_HOVER),
  ) as any;

  const getX = xAccessor ? resolveAccessor(xAccessor as any) : null;
  const getY = yAccessor ? resolveAccessor(yAccessor as any) : null;

  const summary = React.useMemo(() => {
    if (!data?.length || !getX || !getY) {
      return "Empty chart.";
    }

    const xLabel = config?.xAxisLabel || "X";
    const yLabel = config?.yAxisLabel || "Y";
    const xValues = data.map((d) => getX(d));
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
  }, [data, type, config, xAccessor, yAccessor]);

  const active = React.useMemo(() => {
    const datum = hover?.targets?.[0]?.data;
    if (datum == null || !getX || !getY) {
      return "";
    }
    return `${describe(getX(datum))}: ${describe(getY(datum))}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, xAccessor, yAccessor]);

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
