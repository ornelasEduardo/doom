import { InputAction } from "../../engine";
import { resolveAccessor } from "../../types/accessors";
import { Sensor } from "../../types/events";
import { InteractionChannel } from "../../types/interaction";
import { barGeometry, categoryAccessor } from "../../utils/bars";

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
    const entries = (firstSeries?.data ?? state.data).map((datum, index) => ({
      datum,
      index,
      series: firstSeries,
    }));
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
        const category = resolveAccessor(accessor)(datum);
        if (!seen.has(category)) {
          entries.push({ datum, index, series });
          seen.add(category);
        }
      });
    }
    const data = entries.map((entry) => entry.datum);

    if (!data || data.length === 0 || !scales.x) {
      return;
    }

    // Update Focus
    let changed = false;
    if (signal.key === "ArrowRight" || signal.key === "ArrowDown") {
      focusedIndex = Math.min(focusedIndex + 1, data.length - 1);
      changed = true;
    } else if (signal.key === "ArrowLeft" || signal.key === "ArrowUp") {
      focusedIndex = Math.min(Math.max(focusedIndex - 1, 0), data.length - 1);
      changed = true;
      if (focusedIndex < 0) {
        focusedIndex = 0;
      }
    } else if (signal.key === "Escape") {
      focusedIndex = -1;
      removeInteraction(name);
      return;
    }

    if (changed && focusedIndex >= 0) {
      const d = data[focusedIndex];
      const { x: xScale, y: yScale } = scales;

      // createChartStore takes the accessors as separate params, so they live
      // on the store root rather than on `config`.
      const xAcc = xAccessor ?? ((v: any) => v[0]);
      const yAcc = yAccessor ?? ((v: any) => v[1]);

      const getX = resolveAccessor(xAcc);
      const getY = resolveAccessor(yAcc);

      const xVal = getX(d);
      const yVal = getY(d);

      const xPos = (xScale as any)(xVal) || 0;
      const yPos = (yScale as any)(yVal) || 0;

      const primaryTarget = {
        type: "data-point",
        data: d,
        seriesId: "default",
        dataIndex: focusedIndex,
        coordinate: { x: xPos, y: yPos },
        distance: 0,
      };

      const entry = entries[focusedIndex];
      const category = entry.series && categoryAccessor(entry.series);
      const categoryValue = category ? resolveAccessor(category)(d) : undefined;
      const targets = (state.processedSeries ?? []).flatMap((series) => {
        const accessor = categoryAccessor(series);
        const index =
          series.id === entry.series?.id
            ? entry.index
            : accessor
              ? (series.data ?? []).findIndex(
                  (row) => resolveAccessor(accessor)(row) === categoryValue,
                )
              : -1;
        if (index < 0 || !xScale || !yScale) {
          return [];
        }
        const datum = series.data![index];
        const bar =
          series.type === "bar"
            ? barGeometry(series, datum, index, xScale, yScale)
            : null;
        const x = bar
          ? bar.x + bar.width / 2
          : (xScale as (v: unknown) => number)(
              series.xAccessor
                ? resolveAccessor(series.xAccessor)(datum)
                : index,
            );
        const y = bar
          ? bar.y + bar.height / 2
          : (yScale as (v: unknown) => number)(
              series.yAccessor
                ? resolveAccessor(series.yAccessor)(datum)
                : datum,
            );
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
      const target = targets[0] ?? primaryTarget;
      upsertInteraction(name, {
        pointer: {
          x: target.coordinate.x,
          y: target.coordinate.y,
          containerX: target.coordinate.x + state.dimensions.margin.left,
          containerY: target.coordinate.y + state.dimensions.margin.top,
          isTouch: false,
        },
        targets: targets.length ? targets : [primaryTarget],
        target,
      });
    }
  };
};
