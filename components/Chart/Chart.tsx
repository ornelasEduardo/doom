"use client";

import {
  Axis,
  CursorWrapper,
  Footer,
  Grid,
  Header,
  Legend,
  Plot,
  Series,
} from "./subcomponents";
import { Root } from "./subcomponents/Root/Root";
import { Props } from "./types";

export type {
  Accessor,
  Config,
  ContextValue,
  EventType,
  LegendConfig,
  LegendItem,
  Props,
  RenderFrame,
  SeriesProps,
  SeriesType,
} from "./types";

function ChartComposed<T>(props: Props<T>) {
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
