"use strict";

import { useChartContext } from "../../context";
import { SeriesProps } from "../../types";
import { BarSeriesWrapper } from "../BarSeries/BarSeries";
import { CustomSeries } from "../CustomSeries/CustomSeries";
import { LineSeriesWrapper } from "../LineSeries/LineSeries";
import { ScatterSeriesWrapper } from "../ScatterSeries/ScatterSeries";

export function Series<T>(props: SeriesProps<T>) {
  const context = useChartContext<T>();

  // Determine type: prop > context > default "line"
  const type = props.type || context.type || "line";

  // If props.render is present, we prefer CustomSeries UNLESS the user explicitly asked for 'bar'/'line' etc?
  // But wait, the previous issue was that <Chart render={} /> defaults to type="line".
  // So 'type' will likely be 'line' implicitly.

  if (props.render) {
    return <CustomSeries {...props} />;
  }

  // If a custom render function is provided, we default to hiding the standard cursor
  // because the standard cursor logic (vertical line + dots) likely doesn't apply
  // to an arbitrary custom visualization (e.g. pie chart, map).
  // User can explicitly opt-in by passing hideCursor={false}.
  const hideCursor = props.hideCursor ?? (props.render ? true : undefined);

  switch (type) {
    case "bar":
      return <BarSeriesWrapper {...props} hideCursor={hideCursor} />;
    case "scatter":
      return <ScatterSeriesWrapper {...props} hideCursor={hideCursor} />;
    case "area":
      return (
        <LineSeriesWrapper {...props} hideCursor={hideCursor} type="area" />
      );
    case "line":
    default:
      return (
        <LineSeriesWrapper {...props} hideCursor={hideCursor} type="line" />
      );
  }
}
