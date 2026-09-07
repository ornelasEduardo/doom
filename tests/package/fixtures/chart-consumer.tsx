import {
  type Accessor,
  type Behavior,
  Chart,
  type ChartProps,
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
