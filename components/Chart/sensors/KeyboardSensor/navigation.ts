import type { Engine } from "../../engine/Engine";
import type { State } from "../../state/store/chart.store";
import { resolveAccessor } from "../../types/accessors";
import type { InteractionTarget } from "../../types/interaction";
import { barGeometry, categoryAccessor } from "../../utils/bars";
import { clipRectToPlot, isPointInPlot } from "../../utils/plotBounds";
import { samplePosition } from "../../utils/sampleValidity";
import { hasDomainOverride } from "../../utils/scales";

export function buildNavigation<T>(state: State<T>, engine?: Engine<T>) {
  const {
    scales: { x: xScale, y: yScale },
    x: xAccessor,
    y: yAccessor,
  } = state;
  if (!xScale || !yScale) {
    return { slices: [], cacheable: false };
  }
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
      firstCategory ? resolveAccessor(firstCategory)(entry.datum) : entry.index,
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

  const identities = state.processedSeries?.length
    ? state.processedSeries.flatMap((series) =>
        (series.data ?? []).flatMap((datum, dataIndex) =>
          datum == null ? [] : [{ seriesId: series.id, dataIndex }],
        ),
      )
    : entries.map(({ index }) => ({ seriesId: "default", dataIndex: index }));
  const resolved = engine?.resolveTargets(identities);
  const geometry = new Map<
    string,
    Map<number, InteractionTarget<T> | null | undefined>
  >();
  identities.forEach(({ seriesId, dataIndex }, index) => {
    const rows = geometry.get(seriesId) ?? new Map();
    rows.set(dataIndex, resolved?.[index]);
    geometry.set(seriesId, rows);
  });

  // Published geometry uses SVG coordinates; slice construction uses plot coordinates.
  const resolveGeometry = (seriesId: string, dataIndex: number) => {
    const target = geometry.get(seriesId)?.get(dataIndex);
    return target
      ? {
          ...target,
          coordinate: {
            x: target.coordinate.x - state.dimensions.margin.left,
            y: target.coordinate.y - state.dimensions.margin.top,
          },
        }
      : target;
  };

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
      const categoryValue = category ? resolveAccessor(category)(d) : undefined;
      const targets = (state.processedSeries ?? []).flatMap<
        InteractionTarget<T>
      >((series) => {
        const index =
          series.id === entry.series?.id
            ? entry.index
            : (categoryIndices.get(series.id)?.get(categoryValue) ?? -1);
        if (index < 0 || !xScale || !yScale) {
          return [];
        }
        const owned = resolveGeometry(series.id, index);
        if (owned) {
          return [owned];
        }
        // Unpublished custom rows have no rendered keyboard target.
        if (series.type === "custom") {
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
      const ownedPrimary = !entry.series
        ? resolveGeometry("default", entry.index)
        : undefined;
      if (ownedPrimary) {
        return [ownedPrimary];
      }
      return targets.length || entry.series
        ? targets
        : primaryPosition &&
            (!bounded || isPointInPlot(primaryPosition, state.dimensions))
          ? [primaryTarget]
          : [];
    })
    .filter((targets) => targets.length > 0);

  return {
    slices,
    cacheable:
      !!resolved?.length &&
      resolved.every((target) => target?.geometryOwner != null),
  };
}

export function navigationKey<T>(
  state: State<T>,
  engine?: Engine<T>,
): unknown[] {
  return [
    engine,
    engine?.getGeometryRevision?.(),
    state.data,
    state.processedSeries,
    state.x,
    state.y,
    state.dimensions,
    ...Object.values(state.dimensions),
    ...Object.values(state.dimensions.margin),
    state.xDomain,
    state.yDomain,
    state.scales.x,
    state.scales.y,
    ...(state.scales.x?.domain?.() ?? []),
    ...(state.scales.x?.range?.() ?? []),
    ...(state.scales.y?.domain?.() ?? []),
    ...(state.scales.y?.range?.() ?? []),
  ];
}
