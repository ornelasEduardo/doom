import { Scale } from "../types/scales";
import { Series } from "../types/series";
import { resolveAccessor } from "./accessors";

export const categoryAccessor = (series: Series) =>
  series.orientation === "horizontal" ? series.yAccessor : series.xAccessor;
export const valueAccessor = (series: Series) =>
  series.orientation === "horizontal" ? series.xAccessor : series.yAccessor;

export function stackSeries(series: Series[]): Series[] {
  const stacks = new Map<string, Map<unknown, [number, number]>>();
  const orientation =
    series.find((item) => item.type === "bar" && item.orientation !== undefined)
      ?.orientation ?? "vertical";
  const compatible = series
    .filter((item) =>
      item.type !== "bar"
        ? orientation !== "horizontal"
        : item.orientation === undefined || item.orientation === orientation,
    )
    .map((item) =>
      item.type === "bar"
        ? { ...item, orientation: item.orientation ?? orientation }
        : item,
    );
  const stacked = compatible.map((item) => {
    if (item.type !== "bar") {
      return item;
    }
    const category = categoryAccessor(item);
    const value = valueAccessor(item);
    if (!category || !value) {
      return item;
    }
    const key = JSON.stringify([item.orientation ?? "vertical", item.stackId]);
    const totals = stacks.get(key) ?? new Map<unknown, [number, number]>();
    if (item.stackId !== undefined) {
      stacks.set(key, totals);
    }
    const getCategory = resolveAccessor(category);
    const getValue = resolveAccessor(value);
    const stackRanges = (item.data ?? []).map((datum): [number, number] => {
      const v = Number(getValue(datum));
      const categoryKey = getCategory(datum);
      const total = totals.get(categoryKey) ?? [0, 0];
      const sign = v < 0 ? 0 : 1;
      const start = item.stackId === undefined ? 0 : total[sign];
      const end = start + (Number.isFinite(v) ? v : 0);
      total[sign] = end;
      totals.set(categoryKey, total);
      return [start, end];
    });
    return { ...item, stackRanges };
  });
  return stacked.map((item) => {
    const category = categoryAccessor(item);
    if (item.type !== "bar" || !category) {
      return item;
    }
    const totals = stacks.get(
      JSON.stringify([item.orientation ?? "vertical", item.stackId]),
    );
    const stackEnds = item.stackRanges?.map(([start, end], index) => {
      if (item.stackId === undefined) {
        return true;
      }
      const total = totals?.get(resolveAccessor(category)(item.data![index]));
      return start !== end && end === total?.[end < start ? 0 : 1];
    });
    return { ...item, stackEnds };
  });
}

export function barGeometry(
  series: Series,
  datum: unknown,
  index: number,
  x: Scale,
  y: Scale,
) {
  const horizontal = series.orientation === "horizontal";
  const category = categoryAccessor(series);
  const value = valueAccessor(series);
  if (!category || !value) {
    return null;
  }
  const categoryScale = horizontal ? y : x;
  const valueScale = horizontal ? x : y;
  if (!("ticks" in valueScale) && "domain" in valueScale) {
    return null;
  }
  const categoryValue = resolveAccessor(category)(datum);
  // Scale unions have different input domains; category values are validated by the scale.
  const position = (categoryScale as (value: unknown) => number)(categoryValue);
  const bandwidth =
    "bandwidth" in categoryScale ? categoryScale.bandwidth() : 0;
  const automatic =
    bandwidth || ("step" in categoryScale ? categoryScale.step() * 0.8 : 10);
  const thickness =
    typeof series.barWidth === "number" && Number.isFinite(series.barWidth)
      ? Math.max(0, series.barWidth)
      : automatic;
  const categoryStart = position + bandwidth / 2 - thickness / 2;
  const range = series.stackRanges?.[index] ?? [
    0,
    Number(resolveAccessor(value)(datum)),
  ];
  const start = (valueScale as (value: number) => number)(range[0]);
  const end = (valueScale as (value: number) => number)(range[1]);
  return horizontal
    ? {
        x: Math.min(start, end),
        y: categoryStart,
        width: Math.abs(end - start),
        height: thickness,
      }
    : {
        x: categoryStart,
        y: Math.min(start, end),
        width: thickness,
        height: Math.abs(end - start),
      };
}
