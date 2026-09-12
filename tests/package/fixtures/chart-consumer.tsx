import {
  type Accessor,
  type Behavior,
  Chart,
  type ChartProps,
  createInteractionChannel,
  type HoverInteraction,
  InteractionChannel,
  type InteractionChannelHandle,
  type Sensor,
  type SeriesProps,
} from "doom-design-system";

interface Row {
  category: string;
  value: number;
  missing?: number | null;
  object: { count: number };
  date: Date;
}
const rows: Row[] = [
  { category: "Jan", value: 10, object: { count: 1 }, date: new Date() },
];
const sensor: Sensor<Row> = (event, context) => {
  event.primaryCandidate?.data?.value.toFixed();
  context.getChartContext().chartStore.getState().data[0].value.toFixed();
};
const behavior: Behavior<Row> = ({ getChartContext }) => {
  getChartContext().chartStore.getState().data[0].value.toFixed();
};
const props: ChartProps<Row> = {
  data: rows,
  x: "category",
  y: "value",
  sensors: [sensor],
  behaviors: [behavior],
};
<Chart {...props} />;
<Chart.Root {...props} />;
<Chart
  data={rows}
  sensors={[sensor]}
  x={(row) => row.category}
  y={(row) => row.value}
/>;
<Chart.Root data={rows} sensors={[sensor]} x="category" y="value" />;
const key: Accessor<Row, number> = "value";
const fn: Accessor<Row, number> = (row) => row.value;
// @ts-expect-error Object-valued keys are not Cartesian coordinates.
const objectKey: ChartProps<Row> = { data: rows, x: "object" };
// @ts-expect-error Function accessors obey the same value constraint.
const objectFn: ChartProps<Row> = { data: rows, x: (row) => row.object };
// @ts-expect-error Date keys require explicit timestamp conversion.
const dateKey: ChartProps<Row> = { data: rows, x: "date" };
// @ts-expect-error Date functions require explicit timestamp conversion.
const dateFn: ChartProps<Row> = { data: rows, x: (row) => row.date };
const time: ChartProps<Row> = { data: rows, x: (row) => row.date.getTime() };
// @ts-expect-error Size keys must be numeric.
const size: SeriesProps<Row> = { size: "category" };
const missingKey: ChartProps<Row> = { data: rows, y: "missing" };
const missingFn: ChartProps<Row> = { data: rows, y: (row) => row.missing };
const wrongSensor: Sensor<{ other: string }> = () => {};
// @ts-expect-error Sensors must consume the Chart datum type.
const wrong: ChartProps<Row> = { data: rows, sensors: [wrongSensor] };
const wrongBehavior: Behavior<{ other: string }> = () => {};
const wrongBehaviorProps: ChartProps<Row> = {
  data: rows,
  // @ts-expect-error Behaviors must consume the Chart datum type.
  behaviors: [wrongBehavior],
};
// @ts-expect-error JSX inference must not widen the datum to accept an incompatible sensor.
<Chart data={rows} sensors={[wrongSensor]} />;
// @ts-expect-error Root must reject incompatible behaviors too.
<Chart.Root behaviors={[wrongBehavior]} data={rows} />;
const composed: ChartProps<Row> = {
  data: rows,
  sensors: [
    Chart.sensors.DataHoverSensor(),
    Chart.sensors.KeyboardSensor(),
    sensor,
  ],
  behaviors: [Chart.behaviors.Tooltip(), Chart.behaviors.Cursor(), behavior],
};
// @ts-expect-error Numeric accessor keys reject string properties.
const numericKey: Accessor<Row, number> = "category";
// @ts-expect-error Nullable properties require a nullable result contract.
const strictNumericKey: Accessor<Row, number> = "missing";
const seriesMissing: SeriesProps<Row> = {
  x: "missing",
  y: (row) => row.missing,
};
// @ts-expect-error Series keys obey the same axis constraint as Chart.
const seriesObject: SeriesProps<Row> = { x: "object" };

const checkedSensor: Sensor<Row> = (event, context) => {
  // @ts-expect-error Candidate data retains Row, not an untyped datum.
  void event.primaryCandidate?.data?.other;
  // @ts-expect-error Store data retains Row inside a sensor.
  void context.getChartContext().chartStore.getState().data[0].other;
};
const checkedBehavior: Behavior<Row> = (context) => {
  // @ts-expect-error Store data retains Row inside a behavior.
  void context.getChartContext().chartStore.getState().data[0].other;
};

const observer: Sensor<Row> = () => {};
const sensorDefaults = [
  Chart.sensors.DataHoverSensor(),
  Chart.sensors.KeyboardSensor(),
];
<Chart data={rows} sensors={sensorDefaults} x="category" y="value" />;
<Chart data={rows} sensors={[observer]} x="category" y="value" />;
<Chart.Root data={rows} x="category" y="value">
  <Chart.Plot>
    <Chart.Series x="category" y="value" />
    <Chart.Series<Row> x="category" y="missing" />
  </Chart.Plot>
</Chart.Root>;
// @ts-expect-error Explicitly typed inherited series still constrain property values.
<Chart.Series<Row> x="object" />;
// @ts-expect-error A local dataset must constrain series property keys.
<Chart.Series data={rows} x="object" />;

interface ChannelRow {
  category: string;
  value: number;
}
interface ChannelBrush {
  start: number;
  end: number;
  active: boolean;
}
const brushChannel = createInteractionChannel<ChannelBrush>("brushChannel");
const otherChannel = createInteractionChannel<{ color: string }>(
  "brushChannel",
);
const brushSensor: Sensor<ChannelRow> = (event, context) => {
  const managed: HoverInteraction<ChannelRow> = {
    pointer: { x: 0, y: 0, containerX: 0, containerY: 0, isTouch: false },
    targets: [
      {
        data: { category: "a", value: 1 },
        dataIndex: 0,
        coordinate: { x: 0, y: 0 },
      },
    ],
  };
  context.upsertHoverInteraction(sharedHover, managed);
  context.upsertHoverInteraction("remote-hover", managed);
  context.upsertHoverInteraction("crosshair", managed);
  // @ts-expect-error Selection channels cannot store managed hover.
  context.upsertHoverInteraction("selection", managed);
  // @ts-expect-error Drag channels cannot store managed hover.
  context.upsertHoverInteraction("drag", managed);
  // @ts-expect-error Configuration channels cannot store managed hover.
  context.upsertHoverInteraction("cursor-config", managed);
  // @ts-expect-error Owned tooltip configurations cannot store managed hover.
  context.upsertHoverInteraction("tooltip-config:owner", managed);
  // @ts-expect-error Explicit payload generics cannot bypass channel validation.
  context.upsertHoverInteraction<HoverInteraction<ChannelRow>>(
    "selection",
    managed,
  );

  context.batchInteractions((batch) => {
    batch.upsertHoverInteraction(sharedHover, managed);
    batch.upsertHoverInteraction("remote-hover", managed);
    // @ts-expect-error The batch writer enforces reserved configuration names too.
    batch.upsertHoverInteraction("cursor-config:owner", managed);
    // @ts-expect-error Unowned tooltip configurations cannot store managed hover.
    batch.upsertHoverInteraction("tooltip-config", managed);

    batch.getInteraction(sharedHover)?.targets[0].data.value.toFixed();
  });
  // @ts-expect-error Managed hover payloads must contain pointer and targets.
  context.upsertHoverInteraction(sharedHover, { start: 0, end: 1 });
  // @ts-expect-error A custom brush handle cannot be registered as managed hover.
  context.upsertHoverInteraction(brushChannel, managed);

  context.batchInteractions((batch) => {
    batch.upsertInteraction(brushChannel, {
      start: 0,
      end: event.chartX,
      active: true,
    });
    batch.getInteraction(brushChannel)?.end.toFixed();
    batch.upsertInteraction("selection", {
      selection: [{ category: "a", value: 2 }],
      mode: "discrete",
    });
  });
  context
    .getInteraction(InteractionChannel.PRIMARY_HOVER)
    ?.targets[0].data.value.toFixed();
  context.getInteraction("drag")?.target.data.category.toUpperCase();
  context.getInteraction("selection")?.selection[0].value.toFixed();
  context.subscribeInteraction("primary-hover", (hover) =>
    hover?.target?.data.value.toFixed(),
  );
  // @ts-expect-error The handle controls payload type, not the write argument.
  context.upsertInteraction(brushChannel, { color: "red" });
  // @ts-expect-error Payload fields remain strongly typed.
  void context.getInteraction(brushChannel)?.color;
  // @ts-expect-error Builtin writes retain the Chart datum.
  context.upsertInteraction("selection", {
    selection: [{ bad: true }],
    mode: "discrete",
  });
  // @ts-expect-error Builtin keys cannot widen to accept another builtin's payload.
  context.upsertInteraction("primary-hover", {
    selection: [],
    mode: "discrete",
  });
  // @ts-expect-error Builtin reads retain the Chart datum.
  void context.getInteraction("selection")?.selection[0].missing;
  // @ts-expect-error Custom payload shapes require a typed handle.
  context.upsertInteraction("untyped-brush", { start: 0, end: 1 });
  // @ts-expect-error A callback cannot change a channel's payload type.
  context.subscribeInteraction(
    brushChannel,
    (_value: { color: string } | null) => {},
  );
  // @ts-expect-error Handles are invariant in their payload.
  const widened: typeof brushChannel = otherChannel;
  void widened;
};
const brushBehavior: Behavior<ChannelRow> = (context) => {
  const stop = context.subscribeInteraction(
    brushChannel,
    (next, previous) => {
      next?.end.toFixed();
      previous?.start.toFixed();
      context.getInteraction("selection")?.selection[0].category.toUpperCase();
    },
    (a, b) => a?.end === b?.end,
  );
  context.removeInteraction(brushChannel);
  return stop;
};
const brushRows: ChannelRow[] = [{ category: "a", value: 2 }];
<Chart
  behaviors={[brushBehavior]}
  data={brushRows}
  sensors={[brushSensor]}
  x="category"
  y="value"
/>;
<Chart.Root
  behaviors={[brushBehavior]}
  data={brushRows}
  sensors={[brushSensor]}
  x="category"
  y="value"
/>;

const sharedHover =
  createInteractionChannel<HoverInteraction<ChannelRow>>("shared-hover");
<Chart
  behaviors={[
    Chart.behaviors.Cursor({ on: sharedHover }),
    Chart.behaviors.Markers({ on: sharedHover }),
    Chart.behaviors.Tooltip({
      on: sharedHover,
      render: ({ data }) => data[0]?.category,
    }),
  ]}
  data={brushRows}
  sensors={[Chart.sensors.DataHoverSensor({ name: sharedHover })]}
  x="category"
  y="value"
/>;
// @ts-expect-error Opaque handles are invariant, preventing widened-payload writes.
const unsafeWidening: InteractionChannelHandle<
  ChannelBrush | { color: string }
> = brushChannel;
// @ts-expect-error Tooltip requires hover targets, not an arbitrary brush payload.
Chart.behaviors.Tooltip({ on: brushChannel });
// @ts-expect-error Data hover sensors can only populate hover payload channels.
Chart.sensors.DataHoverSensor({ name: brushChannel });
void unsafeWidening;
