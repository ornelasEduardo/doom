"use client";

import {
  Axis,
  CursorWrapper,
  Footer,
  Grid,
  Header,
  Legend,
  Plot,
  Root,
  Series,
} from "./subcomponents";
import { ChartProps } from "./types";

export type {
  Accessor,
  ChartConfig,
  ChartProps,
  LegendConfig,
  LegendItem,
  SeriesContext,
  SeriesProps,
} from "./types";

function ChartComposed<T>(props: ChartProps<T>) {
  if (props.children) {
    return <Root {...props} />;
  }

  return (
    <Root {...props}>
      <Grid />
      <Axis />
      {!props.render && <CursorWrapper mode="line" />}
      <Series render={props.render} type={props.type} x={props.x} y={props.y} />
      {!props.render && <CursorWrapper mode="dots" />}
    </Root>
  );
}

// NOTE: Root handles "Footer", "Legend", "Header" internally via props (title, etc.).
// Checks:
// Root renders Header if title/subtitle exists.
// Root renders Legend if withLegend is true.
// Root renders children inside wrapper.
// So ChartComposed works perfectly.

export const Chart = Object.assign(ChartComposed, {
  Root,
  Header,
  Footer,
  Legend,
  Series,
  Grid,
  Axis,
  Cursor: CursorWrapper,
  Plot,
});
