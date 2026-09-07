import type { Axis, AxisScale } from "d3-axis";

import { AxisOptions } from "../../types/config";
import { d3 } from "../../utils/d3";
import { getAxisTicks, MIN_TICK_GAP } from "../../utils/ticks";

const LABEL_GAP = MIN_TICK_GAP;
type TickValue = string | number;
type TickScale = AxisScale<TickValue> & {
  ticks?: (count: number) => TickValue[];
};

const strideToAvoidOverlap = (
  group: SVGGElement,
  categories: number,
  innerWidth: number,
): number => {
  if (categories < 2 || innerWidth <= 0) {
    return 1;
  }

  let widest = 0;
  group.querySelectorAll<SVGTextElement>(".tick text").forEach((label) => {
    try {
      widest = Math.max(widest, label.getBBox().width);
    } catch {
      // Not laid out (no layout engine): fall through to keeping every label.
    }
  });

  if (widest === 0) {
    return 1;
  }

  const step = innerWidth / categories;
  return Math.max(1, Math.ceil((widest + LABEL_GAP) / step));
};

interface TickLayout {
  direction: "x" | "y";
  length: number;
  options?: AxisOptions;
  defaultTickCount: number;
  defaultTickFormat?: AxisOptions["tickFormat"];
}

export function renderAxisTicks(
  group: SVGGElement,
  axis: Axis<TickValue>,
  {
    direction,
    length,
    options,
    defaultTickCount,
    defaultTickFormat,
  }: TickLayout,
) {
  const scale = axis.scale<TickScale>();
  const selection = getAxisTicks(
    scale,
    length,
    options?.maxTicks,
    defaultTickCount,
  );
  const { count, maxTicks } = selection;
  let values = selection.values;
  axis.ticks(count);
  axis.tickValues(values);
  const format = options?.tickFormat ?? defaultTickFormat;
  if (format) {
    axis.tickFormat(format);
  }
  d3.select(group).call(axis);

  if (options?.tickFormat || maxTicks !== undefined) {
    // Numeric Y domains often run bottom-to-top. Measure in visual order,
    // but retain domain order for D3 and index-sensitive formatters.
    while (values.length > 1) {
      const boxes = Array.from(
        group.querySelectorAll<SVGTextElement>(".tick text"),
        (label, index) => {
          const rect = label.getBoundingClientRect();
          return {
            index,
            start: direction === "x" ? rect.left : rect.top,
            end: direction === "x" ? rect.right : rect.bottom,
          };
        },
      ).sort((a, b) => a.start - b.start);
      let end = -Infinity;
      const kept = new Set<number>();
      for (const box of boxes) {
        if (box.start === box.end) {
          kept.add(box.index);
        } else if (box.start >= end + LABEL_GAP) {
          kept.add(box.index);
          end = box.end;
        }
      }
      const visible = values.filter((_, index) => kept.has(index));
      if (visible.length === values.length) {
        break;
      }
      values = visible;
      axis.tickValues(values);
      d3.select(group).call(axis);
    }
  } else if (direction === "x" && !scale.ticks) {
    // Preserve the existing unconfigured categorical X-axis treatment.
    const stride = strideToAvoidOverlap(group, values.length, length);
    if (stride > 1) {
      axis.tickValues(values.filter((_, i) => i % stride === 0));
      d3.select(group).call(axis);
    }
  }
}
