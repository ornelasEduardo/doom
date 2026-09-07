import { InputAction } from "../../engine";
import { resolveAccessor } from "../../types/accessors";
import { Sensor } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { barGeometry, categoryAccessor } from "../../utils/bars";
import { clipRectToPlot, isPointInPlot } from "../../utils/plotBounds";
import { samplePosition } from "../../utils/sampleValidity";
import { hasDomainOverride } from "../../utils/scales";

/**
 * Professional-grade Keyboard Sensor for A11y.
 * Allows navigating data points using ArrowKeys.
 */
export const KeyboardSensor = (options: { name?: string } = {}): Sensor => {
  const { name = InteractionChannel.PRIMARY_HOVER } = options;
  let focusedIndex = -1;

  return (event, { getChartContext, upsertInteraction, removeInteraction }) => {
    const { signal } = event;

    // Only handle KEY actions
    if (signal.action !== InputAction.KEY || !signal.key) {
      return;
    }

    const ctx = getChartContext();
    const { chartStore } = ctx;
    const state = chartStore.getState();
    const { scales, x: xAccessor, y: yAccessor } = state;
    const firstSeries = state.processedSeries?.[0];
    const entries = (firstSeries?.data ?? state.data).flatMap((datum, index) =>
      datum == null
        ? []
        : [
            {
              datum,
              index,
              series: firstSeries,
            },
          ],
    );
    const firstCategory = firstSeries && categoryAccessor(firstSeries);
    const seen = new Set(
      entries.map((entry) =>
        firstCategory
          ? resolveAccessor(firstCategory)(entry.datum)
          : entry.index,
      ),
    );
    for (const series of (state.processedSeries ?? []).slice(1)) {
      const accessor = categoryAccessor(series);
      if (!accessor) {
        continue;
      }
      (series.data ?? []).forEach((datum, index) => {
        if (datum == null) {
          return;
        }
        const category = resolveAccessor(accessor)(datum);
        if (!seen.has(category)) {
          entries.push({ datum, index, series });
          seen.add(category);
        }
      });
    }
    if (signal.key === "Escape") {
      focusedIndex = -1;
      removeInteraction(name);
      return;
    }
    const forward = signal.key === "ArrowRight" || signal.key === "ArrowDown";
    const backward = signal.key === "ArrowLeft" || signal.key === "ArrowUp";
    if (!forward && !backward) {
      return;
    }
    const { x: xScale, y: yScale } = scales;
    if (!xScale || !yScale) {
      return;
    }
    const bounded =
      hasDomainOverride(xScale, state.xDomain) ||
      hasDomainOverride(yScale, state.yDomain);

    // Index each series once instead of rescanning its rows for every slice.
    const categoryIndices = new Map(
      (state.processedSeries ?? []).map((series) => {
        const indices = new Map<unknown, number>();
        const accessor = categoryAccessor(series);
        if (accessor) {
          const getCategory = resolveAccessor(accessor);
          (series.data ?? []).forEach((datum, index) => {
            if (datum == null) {
              return;
            }
            const value = getCategory(datum);
            // Match findIndex's first occurrence and strict equality for NaN.
            if (!Number.isNaN(value) && !indices.has(value)) {
              indices.set(value, index);
            }
          });
        }
        return [series.id, indices];
      }),
    );

    // Filter whole slices, preserving a category when any series is visible.
    const slices = entries
      .map((entry) => {
        const d = entry.datum;
        const primaryPosition = samplePosition(
          d,
          xAccessor ? resolveAccessor(xAccessor) : (datum) => datum[0],
          yAccessor ? resolveAccessor(yAccessor) : (datum) => datum[1],
          xScale,
          yScale,
        );
        const primaryTarget = {
          type: "data-point",
          data: d,
          seriesId: "default",
          dataIndex: entry.index,
          coordinate: primaryPosition ?? { x: NaN, y: NaN },
          distance: 0,
        };
        const category = entry.series && categoryAccessor(entry.series);
        const categoryValue = category
          ? resolveAccessor(category)(d)
          : undefined;
        const targets = (state.processedSeries ?? []).flatMap((series) => {
          const index =
            series.id === entry.series?.id
              ? entry.index
              : (categoryIndices.get(series.id)?.get(categoryValue) ?? -1);
          if (index < 0 || !xScale || !yScale) {
            return [];
          }
          const datum = series.data![index];
          const sample = samplePosition(
            datum,
            series.xAccessor ? resolveAccessor(series.xAccessor) : () => index,
            series.yAccessor
              ? resolveAccessor(series.yAccessor)
              : (value) => value,
            xScale,
            yScale,
          );
          if (!sample) {
            return [];
          }
          const geometry =
            series.type === "bar"
              ? barGeometry(series, datum, index, xScale, yScale)
              : null;
          const bar =
            geometry && bounded
              ? clipRectToPlot(geometry, state.dimensions)
              : geometry;
          if (series.type === "bar" && !bar) {
            return [];
          }
          const x = bar ? bar.x + bar.width / 2 : sample.x;
          const y = bar ? bar.y + bar.height / 2 : sample.y;
          if (bounded && !isPointInPlot({ x, y }, state.dimensions)) {
            return [];
          }
          return [
            {
              ...primaryTarget,
              data: datum,
              dataIndex: index,
              seriesId: series.id,
              seriesColor: series.color,
              coordinate: { x, y },
              suppressMarker: series.type === "bar",
            },
          ];
        });
        return targets.length || entry.series
          ? targets
          : primaryPosition &&
              (!bounded || isPointInPlot(primaryPosition, state.dimensions))
            ? [primaryTarget]
            : [];
      })
      .filter((targets) => targets.length > 0);

    if (!slices.length) {
      focusedIndex = -1;
      removeInteraction(name);
      return;
    }
    focusedIndex = forward
      ? Math.min(focusedIndex + 1, slices.length - 1)
      : Math.min(Math.max(focusedIndex - 1, 0), slices.length - 1);
    const targets = slices[focusedIndex];
    const target = targets[0];
    upsertInteraction(name, {
      pointer: {
        x: target.coordinate.x,
        y: target.coordinate.y,
        containerX: target.coordinate.x + state.dimensions.margin.left,
        containerY: target.coordinate.y + state.dimensions.margin.top,
        isTouch: false,
      },
      targets,
      target,
    });
  };
};
