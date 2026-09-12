# Chart

## Import

```tsx
import { Chart } from "doom-design-system";
```

Peer dependency: `npm install d3`

## Props

`ChartProps<T>` extends `React.HTMLAttributes<HTMLDivElement>`, so `id`,
`data-*`, `aria-*`, `onClick` and the rest land on the chart element. The
component's own semantics win on conflict.

> `Props` is still exported as a deprecated alias. Prefer `ChartProps`.

| Prop            | Type                                        | Default     | Description                                                                                 |
| --------------- | ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `data`          | `T[]`                                       | required    | Data array                                                                                  |
| `x`             | `keyof T \| (d: T) => string \| number`     | required    | X-axis accessor (string key or function)                                                    |
| `y`             | `keyof T \| (d: T) => number`               | required    | Y-axis accessor (string key or function)                                                    |
| `xDomain`       | `readonly [number \| null, number \| null]` | automatic   | Numeric X bounds; `null` keeps that end automatic. Ignored for categorical X.               |
| `yDomain`       | `readonly [number \| null, number \| null]` | automatic   | Numeric Y bounds; `null` keeps that end automatic. Ignored for categorical Y.               |
| `type`          | `"line" \| "area" \| "bar" \| "scatter"`    | —           | Chart type (shorthand API)                                                                  |
| `title`         | `string \| ReactNode`                       | —           | Chart title                                                                                 |
| `subtitle`      | `string`                                    | —           | Chart subtitle                                                                              |
| `withLegend`    | `boolean`                                   | —           | Show legend                                                                                 |
| `withFrame`     | `boolean`                                   | `true`      | Render card frame around chart                                                              |
| `variant`       | `"default" \| "solid"`                      | `"default"` | Visual variant                                                                              |
| `flat`          | `boolean`                                   | `false`     | Remove shadow                                                                               |
| `d3Config`      | `Config`                                    | —           | D3 configuration options                                                                    |
| `render`        | `(frame: RenderFrame<T>) => void`           | —           | Custom D3 render function                                                                   |
| `sensors`       | `Sensor[]`                                  | —           | Custom sensors (replaces pointer defaults; baseline keyboard navigation is always retained) |
| `behaviors`     | `Behavior[]`                                | —           | Custom behaviors (replaces defaults)                                                        |
| `onValueChange` | `(data: T \| null) => void`                 | —           | Callback when hovered value changes                                                         |
| `style`         | `CSSProperties`                             | —           | Inline styles                                                                               |
| `className`     | `string`                                    | —           | CSS class name                                                                              |

## d3Config Fields

| Field             | Type                                   | Default | Description                                                                       |
| ----------------- | -------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| `margin`          | `{ top, right, bottom, left }`         | —       | Chart margins                                                                     |
| `width`           | `number`                               | —       | Fixed width override                                                              |
| `height`          | `number`                               | —       | Fixed height override                                                             |
| `curve`           | `d3Shape.CurveFactory`                 | —       | D3 curve factory (e.g. `curveMonotoneX`)                                          |
| `showAxes`        | `boolean`                              | `true`  | Show X/Y axes                                                                     |
| `xAxisLabel`      | `string`                               | —       | X-axis label text                                                                 |
| `axes`            | `{ x?: AxisOptions; y?: AxisOptions }` | —       | Per-axis tick formatting and label limits using the same options for either axis. |
| `yAxisLabel`      | `string`                               | —       | Y-axis label text                                                                 |
| `grid`            | `boolean`                              | —       | Show grid lines                                                                   |
| `withGradient`    | `boolean`                              | —       | Fill area with gradient                                                           |
| `showDots`        | `boolean`                              | —       | Show data point dots                                                              |
| `hideYAxisDomain` | `boolean`                              | —       | Hide Y-axis domain line                                                           |
| `type`            | `SeriesType`                           | —       | Series type override within config                                                |

Numeric timestamps use the existing linear scale, not calendar-aligned time ticks.
`axes.x.valueFormat` and `axes.y.valueFormat` accept
`(value: string | number) => string` for axis labels and selected-value
announcements, including values between ticks. Scale values and tooltip data
are unchanged. Use these for dates, currencies, and other value-based labels.

`tickFormat(value, index)` overrides tick labels using the index in the axis
candidate list, before collision removal. Selected values that are tick
candidates reuse that same index, regardless of series row order. Without
`valueFormat`, off-tick readings retain their raw value rather than inventing a
tick index. When both callbacks exist, `valueFormat` controls announcements.
Each axis accepts `maxTicks`: positive values are floored, invalid values ignored,
and labels may be thinned further to fit. Unconfigured axes keep their defaults.
Existing `xAxisLabel`, `yAxisLabel`, and domain props remain unchanged.

```tsx
d3Config={{
  axes: {
    x: { valueFormat: value => dateFormat.format(Number(value)), maxTicks: 6 },
    y: { valueFormat: value => currencyFormat.format(Number(value)), maxTicks: 5 },
  },
}}
```

## Usage

```tsx
// Shorthand API — simple line/area/bar chart
<Chart
  type="area"
  data={data}
  x="month"            // String accessor (keyof T)
  y={(d) => d.revenue}  // Function accessor
  title="Monthly Revenue"
  withLegend
  d3Config={{ grid: true, withGradient: true }}
/>

// Composition API — custom layouts
<Chart.Root data={data} type="line" x="label" y="value" d3Config={{ grid: true }}>
  <Chart.Header title="Sales" subtitle="Last 12 months">
    <Chart.Legend />
  </Chart.Header>
  <Chart.Plot>
    <Chart.Grid />
    <Chart.Cursor />
    <Chart.Series type="area" x="label" y="value" />
    <Chart.Axis />
  </Chart.Plot>
  <Chart.Footer>Custom footer content</Chart.Footer>
</Chart.Root>

// Custom D3 render — for pie, treemap, etc.
<Chart
  data={pieData}
  x="label"
  y="value"
  d3Config={{ showAxes: false, grid: false }}
  render={(frame) => {
    // frame.container is a D3 selection — use full D3 API
    // frame.scales, frame.data, frame.size, frame.theme available
  }}
/>
```

Missing or nonfinite axis samples form gaps in line and area series and are
omitted from scatter, bubble, and bar marks and interaction targets. Zero is a
valid sample; a zero-valued bar retains its normal invisible geometry. Sparse
arrays and absent rows are skipped safely, and hover/keyboard targets keep the
original datum indices. For scatter with `size`, an invalid optional size uses
the default point radius and does not affect the size range; size zero remains
valid.

## Axis domains

`xDomain` and `yDomain` are top-level props on both `Chart` and `Chart.Root`,
not fields in `d3Config`. Each accepts a readonly `[lower, upper]` tuple.
An omitted prop or `[null, null]` uses automatic bounds. Each numeric endpoint
is exact: padding and D3 `nice()` do not move an explicit endpoint. A `null`
endpoint retains the corresponding automatic bound.

```tsx
// Reuse the same bounds and chart height for an honest regional comparison.
const revenueDomain = [0, 100] as const;

<Chart data={north} type="line" x="month" y="revenue"
  yDomain={revenueDomain} title="North revenue (USD thousands)" />
<Chart data={south} type="line" x="month" y="revenue"
  yDomain={revenueDomain} title="South revenue (USD thousands)" />

// Fix only the upper bound; calculate the lower bound automatically.
<Chart.Root data={readings} type="line" x="hour" y="temperature"
  xDomain={[0, 24]} yDomain={[null, 40]}>
  <Chart.Plot>
    <Chart.Series label="Temperature (°C)" type="line" />
    <Chart.Axis />
  </Chart.Plot>
</Chart.Root>
```

- A tuple containing a nonfinite number (`NaN` or either infinity), or two
  explicit bounds that are reversed or equal, is ignored in its entirety.
  That axis falls back to its automatic domain.
- If a one-sided override would leave the domain descending or collapsed,
  the automatic end extends outward by `max(1, abs(explicitEndpoint) * 0.1)`.
  For example, automatic `[0, 5]` with `[20, null]` becomes `[20, 22]`.
  The explicit end stays exact, even when it excludes all data.
- Categorical axes ignore overrides. For vertical bars, use `yDomain` for
  values; for horizontal bars, use `xDomain` for values.

Without overrides, numeric Y bounds include zero, pad negative and positive
extrema outward by 10%, then apply D3 `nice()` for readable ticks. A negative
line metric can therefore cross zero without losing its negative values.
The empty-data scale utility starts with `[0, 1]` and applies `nice()`;
an empty chart currently creates no scales.

For charts containing only non-bar series, automatic bounds come from root
`data` and accessors. A series' own data does not expand those bounds: give
the root a dataset spanning all series, or set explicit bounds covering them.
Bar bounds account for registered series and signed stack totals; mixed
vertical-bar charts also retain and expand existing root and non-bar domains.
Overrides apply after these automatic domains are calculated.

With a valid numeric domain override, built-in series rendering is clipped
along that axis. Marks on unaffected axes retain their normal appearance.
Points whose centers fall outside the plot are excluded from interactions,
including hover and keyboard navigation. Partially visible bars remain
interactable; their tooltip values describe the original data, not just the
visible portion. Custom rendering is responsible for its own clipping.

See the **Signed Line Metric** and **Shared Fixed Y Bounds** stories for signed
cash flow and two regions compared with equal heights and the same exact range.

## Architecture

The Chart uses a layered pipeline: **Engine → Sensors → Store → Behaviors**.

```
Browser Event (pointer/touch/keyboard)
  → InteractionLayer (native controls and normalization)
    → Engine.input(InputSignal)
      → Scheduler (one sampled movement per input stream per frame)
        → SpatialMap.find() + CoordinateSystem (hit detection at dispatch)
          → Sensors (process EngineEvent, update store)
            → Store (interactions map triggers subscriptions)
              → Behaviors (subscribe to store, update D3 visuals)
```

### Engine

Per-chart orchestrator with a normalized-input API and DOM-backed coordinate and hit-test adapters. Converts raw input into processed `EngineEvent`s with hit-test candidates.

**Key files:** `Chart/engine/Engine.ts`, `engine/SpatialMap.ts`, `engine/CoordinateSystem.ts`, `engine/Scheduler.ts`

- **InputSignal** — Normalized input format: `{ id, action, source, x, y, timestamp, key?, modifiers? }`
  - Actions: `START`, `MOVE`, `END`, `CANCEL`, `KEY`
  - Sources: `MOUSE`, `TOUCH`, `PEN`, `KEYBOARD`, `REMOTE`
- **SpatialMap** — Hybrid hit detection: DOM `elementsFromPoint()` broad phase + quadtree fine phase. Configurable `magneticRadius` (default 40px) for snapping.
- **CoordinateSystem** — Transforms client → container → plot-relative coordinates.
- **Scheduler** — Priority-based: `CRITICAL` (sync, for pointer down/up), `VISUAL` (RAF-batched, for moves), `IDLE` (requestIdleCallback). Visual queue coalesces by user, source, and pointer ID. The final pending movement is delivered before `END`. `CANCEL` clears its stream; `cancelScope: "chart"` explicitly dismisses all queued chart input. Movement is frame-sampled, not a lossless drawing-event log.

### EngineEvent

The processed output sensors receive:

| Field              | Type                        | Description                                       |
| ------------------ | --------------------------- | ------------------------------------------------- |
| `signal`           | `InputSignal`               | Raw normalized input                              |
| `candidates`       | `InteractionCandidate<T>[]` | All hit results, sorted by relevance              |
| `primaryCandidate` | `InteractionCandidate<T>`   | Closest/most relevant hit                         |
| `sliceCandidates`  | `InteractionCandidate<T>[]` | All series points at primary's X (vertical slice) |
| `chartX`           | `number`                    | X relative to plot area                           |
| `chartY`           | `number`                    | Y relative to plot area                           |
| `isWithinPlot`     | `boolean`                   | Whether pointer is inside the plot bounds         |

### InteractionCandidate

| Field         | Type                                                                                | Description                                          |
| ------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `type`        | `"data-point" \| "bar" \| "area" \| "label" \| "axis" \| "legend-item" \| "custom"` | Hit target type                                      |
| `data`        | `T`                                                                                 | The underlying data object                           |
| `seriesId`    | `string`                                                                            | Series identifier                                    |
| `dataIndex`   | `number`                                                                            | Index in data array                                  |
| `seriesColor` | `string`                                                                            | Series color                                         |
| `coordinate`  | `{ x, y }`                                                                          | Coordinates in the chart SVG, including plot margins |
| `distance`    | `number`                                                                            | Distance from pointer                                |
| `element`     | `Element`                                                                           | DOM element hit                                      |
| `draggable`   | `boolean`                                                                           | Whether target is draggable                          |

### Store (State Management)

Unified store with slices: `lifecycle`, `dimensions`, `data`, `series`, `interactions`, `scales`.

Key operations:

- `upsertInteraction(store, name, payload)` — Write to interactions map
- `removeInteraction(store, name)` — Delete from interactions map
- `chartStore.subscribe(listener)` — Subscribe to changes (used by behaviors)
- `chartStore.useStore(selector?)` — React hook via `useSyncExternalStore`

### Interaction Channels

| Channel            | Constant                            | Used By                         |
| ------------------ | ----------------------------------- | ------------------------------- |
| `"primary-hover"`  | `InteractionChannel.PRIMARY_HOVER`  | DataHoverSensor, KeyboardSensor |
| `"selection"`      | `InteractionChannel.SELECTION`      | SelectionSensor                 |
| `"drag"`           | `InteractionChannel.DRAG`           | DragSensor                      |
| `"cursor-config"`  | `InteractionChannel.CURSOR_CONFIG`  | Cursor behavior                 |
| `"tooltip-config"` | `InteractionChannel.TOOLTIP_CONFIG` | Tooltip behavior                |
| `"crosshair"`      | `InteractionChannel.CROSSHAIR`      | Custom crosshair state          |

> **Channel payloads are not uniform.** `primary-hover` and `drag` carry
> `targets`, while `selection` carries `selection` — a plain array of the
> selected data objects, plus `mode`. Read the channel you are writing a
> behavior against rather than assuming a shared shape.

## Series System

Each series type registers itself with the store and gets an automatic interaction strategy.

A `<Chart.Series>` may carry its own `data`, which is used for both rendering and
hit-testing. In charts containing only non-bar series, scales derive from root
`data`; give `Chart.Root` a dataset spanning the full range or explicit
`xDomain` / `yDomain` bounds covering the series. Bars derive their
category domain and signed value totals from registered series data. Mixed
vertical-bar charts preserve and expand root and registered non-bar domains.
See [bar orientation, thickness, and stacks](#bar-orientation-thickness-and-stacks).

Series that do not name a `color` are assigned one from the categorical data
palette in registration order, so sibling series are distinguishable and
re-theme with the rest of the system:

| Token              | Default            |
| ------------------ | ------------------ |
| `--chart-series-1` | `var(--primary)`   |
| `--chart-series-2` | `var(--accent)`    |
| `--chart-series-3` | `var(--success)`   |
| `--chart-series-4` | `var(--warning)`   |
| `--chart-series-5` | `var(--error)`     |
| `--chart-series-6` | `var(--secondary)` |

These are deliberately separate from the semantic UI tokens: `variant="solid"`
remaps `--primary` to the axis colour and `--secondary` to near-background, so a
palette built on those would render two series unreadable. Override
`--chart-series-*` to brand the palette.

| Condition            | Strategy           | Complexity       |
| -------------------- | ------------------ | ---------------- |
| < 50 items           | `LinearStrategy`   | O(n) scan        |
| line/area (sorted X) | `BinaryXStrategy`  | O(log n) bisect  |
| scatter/bubble       | `QuadtreeStrategy` | O(log n) spatial |
| Fallback             | `LinearStrategy`   | O(n) scan        |

**Key files:** `subcomponents/Series/`, `subcomponents/{LineSeries,BarSeries,ScatterSeries,CustomSeries}/`, `sensors/utils/strategies/`

## Extension API

Everything needed to write a sensor or behavior is exported from the package
entry. The built-ins are namespaced on `Chart`, because the `Tooltip` behavior
would otherwise collide with the standalone `Tooltip` component.

```tsx
import {
  Chart,
  InputAction,
  InputSource,
  InteractionChannel,
  type Behavior,
  type EngineEvent,
  type Sensor,
  type SensorContext,
} from "doom-design-system";

Chart.sensors; // DataHoverSensor, KeyboardSensor, DragSensor, SelectionSensor
Chart.behaviors; // Tooltip, Cursor, Markers, Dim, DraggablePuck, SelectionUpdate
```

The default tooltip displays the sensor's selected targets. Use
`Chart.sensors.DataHoverSensor({ verticalSlice: false })` for a single-point
tooltip. Baseline keyboard navigation is always retained.

`sensors` replaces pointer defaults; SensorManager always retains baseline
keyboard navigation and announcements. Supplied KeyboardSensors may add custom
channels. Multiple KeyboardSensors handling the same channel process each input
once, including a supplied default-channel KeyboardSensor and the baseline.
`behaviors` replaces the default behaviors, so include the built-ins you need:

```tsx
const sensors = useMemo(
  () => [Chart.sensors.DataHoverSensor({ verticalSlice: true }), RangeSensor()],
  [],
);

<Chart data={data} x="month" y="revenue" sensors={sensors} />;
```

> **Keep factory instances stable.** Sensors hold their state in a closure, so calling a
> factory inline — `sensors={[DragSensor()]}` — builds a new sensor on every
> render and discards any in-progress gesture. A stable sensor in a fresh array
> literal is fine; the component compares contents, not array identity.

## Sensors

Sensors receive `EngineEvent`s and write to the interaction store. Stateful sensors keep gesture ownership in a closure.

### Type Signature

```tsx
type Sensor<T = unknown> = (
  event: EngineEvent<T>,
  context: SensorContext<T>,
) => void;

interface SensorContext<T> extends InteractionAccess<T> {
  getChartContext: () => ContextValue<T>;
}
```

### Built-in Sensors

| Sensor            | Options                                      | Description                                     |
| ----------------- | -------------------------------------------- | ----------------------------------------------- |
| `DataHoverSensor` | `{ name?, hitPolicy?, verticalSlice? }`      | Tracks pointer hover, writes `HoverInteraction` |
| `KeyboardSensor`  | `{ name? }`                                  | Arrow key navigation through data points (a11y) |
| `DragSensor`      | `{ name?, onDrag?, onDragEnd?, hitRadius? }` | Drag-to-edit with scale inversion               |
| `SelectionSensor` | `{ name? }`                                  | Click-to-select with toggle support             |

**Defaults by chart type:**

- line/area/bar: `DataHoverSensor({ verticalSlice: true })` + `KeyboardSensor`
- scatter/bubble/custom: `DataHoverSensor()` + `KeyboardSensor`

### Creating a Custom Sensor

Create a typed channel once and share its handle between the sensor and behavior.
The name is diagnostic: two handles named `"range"` remain isolated. Stores are
per chart, so sharing a handle does not synchronize charts automatically.

```tsx
import {
  createInteractionChannel,
  InputAction,
  type Sensor,
} from "doom-design-system";

interface Range {
  start: number;
  end: number;
  active: boolean;
}
const rangeChannel = createInteractionChannel<Range>("range");

function RangeSensor<T>(): Sensor<T> {
  let owner: string | null = null;
  let start = 0;
  return ({ signal, chartX, isWithinPlot }, context) => {
    const stream = JSON.stringify([signal.userId, signal.source, signal.id]);
    if (signal.action === InputAction.START && isWithinPlot && owner === null) {
      owner = stream;
      start = chartX;
      signal.native?.capturePointer();
      signal.native?.preventDefault();
    }
    if (
      signal.action === InputAction.CANCEL &&
      (signal.cancelScope === "chart" || owner === stream)
    ) {
      owner = null;
      context.removeInteraction(rangeChannel);
      return;
    }
    if (
      owner !== stream ||
      ![InputAction.START, InputAction.MOVE, InputAction.END].includes(
        signal.action,
      )
    )
      return;
    const active = signal.action !== InputAction.END;
    context.upsertInteraction(rangeChannel, {
      start: Math.min(start, chartX),
      end: Math.max(start, chartX),
      active,
    });
    if (!active) owner = null;
  };
}
```

Create each stateful sensor once per chart instance, for example with `useMemo`.
Include `Chart.sensors.DataHoverSensor()` if the chart should also retain pointer
hover. Keyboard navigation remains available for unclaimed keyboard actions.

Native controls are synchronous capabilities: capture or prevent the default
inside the `START` callback. They expire when the native listener returns and
are unavailable on deferred movement. Capturing a pointer does not disable the
browser's touch scrolling; choose an appropriate `touch-action` for a dedicated
gesture surface. Input signals include pointer type, buttons, pressure, keyboard
code/repeat, and keyboard phase (`keyPhase: "down" | "up"`). A custom keyboard sensor sets `event.claimed`
to own an action; `event.handled` requests native default prevention. Unclaimed
keys reach baseline keyboard navigation. `engine.subscribeCancellation(listener)`
observes stream or chart cancellation, including engine disposal; return its
unsubscribe function from the owning behavior cleanup. Native capture release
follows engine cancellation even when a keyboard or remote producer initiates it.

`hitPolicy: "exact"` requires a DOM hit; `"topmost"` prefers the front DOM hit
and falls back to magnetic picking; `"nearest"` chooses by distance.

## Behaviors

Behaviors subscribe to state and update visuals. Each behavior instance attaches to a ready plot and returns a cleanup function.

### Type Signature

```tsx
type Behavior<T = unknown> = (
  context: BehaviorContext<T>,
) => (() => void) | void;
type GenericBehavior = <T>(context: BehaviorContext<T>) => (() => void) | void;

interface BehaviorContext<T> extends InteractionAccess<T> {
  getChartContext: () => ContextValue<T> & { g: D3Selection | null };
}
```

Use `Behavior<Row>` for a datum-specific behavior, or `GenericBehavior` when it
works with any datum type. Both contexts expose typed `getInteraction`,
`upsertInteraction`, and `removeInteraction`. `subscribeInteraction(channel, listener, equality?)`
notifies only when that channel changes, using `Object.is` by default. Read the
initial snapshot explicitly before subscribing. `batchInteractions(writer =>
{ ... })` stages related updates with read-your-writes and publishes once;
throwing discards the staged changes. The callback must be synchronous; async callbacks are rejected. Subscriber errors are reported independently so healthy subscribers still run. Subscriptions observe the latest committed snapshot, not an event log: reentrant writes can supersede intermediate snapshots before later subscribers read them.

Use `upsertHoverInteraction(channel, reading)` when the chart should keep a
reading synchronized with its series and geometry. Built-in hover and keyboard
sensors use this method for both named and typed channels. Streaming updates
refresh managed readings, and actual series or geometry removal clears them.
Custom geometry is authoritative; it is never projected through Cartesian
accessors while waiting for the renderer's geometry update. Preserve the opaque
`geometryOwner` field when copying engine targets.

`upsertInteraction` leaves reconciliation to your extension, even on
`primary-hover`. It also removes any previous managed registration for that
channel. This is appropriate for the range example, or linked readings whose
semantic identity policy is controlled by an application. Batch writers expose
both operations and publish their management metadata atomically.

Hover readings can set `anchor: "target"` to attach tooltips to the current
selected point. The default `"pointer"` policy follows the supplied pointer
position. Keyboard sensors use target anchoring, including during stationary
data and layout updates.

Behaviors retain their closure and DOM when siblings are added, removed, or
reordered. Removing a behavior or replacing its plot runs its cleanup. Keep
behavior factory instances stable across React renders.

### Built-in Behaviors

| Behavior          | Options                                | Description                                                 |
| ----------------- | -------------------------------------- | ----------------------------------------------------------- |
| `Tooltip`         | `{ on?, render? }`                     | Positions tooltip near pointer                              |
| `Cursor`          | `{ on?, showX?, showY? }`              | Vertical/horizontal crosshair lines                         |
| `Markers`         | `{ on?, radius?, color? }`             | Circles at hovered data points                              |
| `Dim`             | `{ on?, selector?, opacity? }`         | Dims non-hovered elements (default 0.3 opacity)             |
| `SelectionUpdate` | `{ on?, fn? }`                         | Reflects selection and delivers selected data to a callback |
| `DraggablePuck`   | `{ on?, radius?, color?, showGhost? }` | Visual feedback for drag (puck + ghost + connecting line)   |

**Defaults by chart type:**

- All types: `Tooltip` + `Cursor({ showX: true })`
- line/area: + `Markers({ radius: 8 })`
- bar/scatter: + `Dim`

### Creating a Custom Behavior

This behavior consumes the `rangeChannel` above without a cast or direct store
write. Its initial read also supports a range created before the behavior mounts.

```tsx
import type { Behavior } from "doom-design-system";

function HighlightRange<T>(): Behavior<T> {
  return (context) => {
    const { g, chartStore } = context.getChartContext();
    if (!g) return;
    const rect = g
      .append("rect")
      .attr("fill", "var(--primary)")
      .attr("opacity", 0.15)
      .attr("pointer-events", "none");
    const draw = () => {
      const range = context.getInteraction(rangeChannel);
      rect.attr("display", range ? null : "none");
      if (range)
        rect
          .attr("x", range.start)
          .attr("y", 0)
          .attr("width", range.end - range.start)
          .attr("height", chartStore.getState().dimensions.innerHeight);
    };
    draw();
    const unsubscribe = chartStore.subscribe(draw);
    return () => {
      unsubscribe();
      rect.remove();
    };
  };
}
```

This example subscribes to the chart store because its height must follow layout
changes as well as the range. A behavior depending only on the range can use
`context.subscribeInteraction(rangeChannel, draw)` instead.

Tooltip renderers receive one stable payload: `{ data, targets, pointer }`.
`data` is always an array; targets carry series metadata and SVG coordinates.
The default multi-series tooltip renders only identified targets. Without a
series ID it displays the first target using the root accessors; it never
reconstructs additional series by category. Use `render` for custom payloads.
Multiple cursor or tooltip behaviors own independent overlays and can observe
different channels without replacing each other.

## Composition API Subcomponents

| Subcomponent   | Description                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------- |
| `Chart.Root`   | Creates store + engine, provides context, manages resize                                    |
| `Chart.Header` | Title + subtitle container, accepts `<Chart.Legend />` as child                             |
| `Chart.Footer` | Footer content below the chart                                                              |
| `Chart.Legend` | Series legend                                                                               |
| `Chart.Plot`   | SVG wrapper with proper transforms                                                          |
| `Chart.Series` | Router: switches on `type` to `LineSeries`, `BarSeries`, `ScatterSeries`, or `CustomSeries` |
| `Chart.Grid`   | Grid lines                                                                                  |
| `Chart.Axis`   | X/Y axes with labels                                                                        |
| `Chart.Cursor` | Crosshair lines (reads from `CURSOR_CONFIG` channel)                                        |

## RenderFrame Type

Available in the `render` prop and `CustomSeries`:

| Field                | Type                                      | Description                                              |
| -------------------- | ----------------------------------------- | -------------------------------------------------------- |
| `container`          | `D3Selection<T>`                          | SVG group — use for D3 rendering                         |
| `data`               | `T[]`                                     | Chart data                                               |
| `size`               | `{ width, height, radius }`               | Plot dimensions                                          |
| `scales`             | `{ x?: XScale, y?: YScale }`              | D3 scale instances                                       |
| `theme`              | `{ colors: string[], isMobile: boolean }` | Theme values                                             |
| `config`             | `Config`                                  | Active d3Config                                          |
| `seriesId`           | `string`                                  | Series identifier                                        |
| `resolveInteraction` | `(event) => { element, data } \| null`    | Hit-test helper                                          |
| `chartDataAttrs`     | `{ TYPE, SERIES_ID, INDEX, DRAGGABLE }`   | DOM data attributes for hit detection                    |
| `geometry`           | `CustomGeometry<T>`                       | Owner-scoped interaction points for this custom renderer |

### Custom geometry

Custom renderers receive `frame.geometry.update(points)`. Points use local
render-group coordinates; an optional `element` identifies a nested SVG
coordinate system. Supply `data`, `dataIndex`, `x`, and `y`; the chart supplies
the owning series ID. Rendering and interaction geometry should be updated
together. Passing an empty array clears that owner's points. Unmounting the
series disposes its registration, while root data updates preserve other owners.
Custom renderers also run with empty data so D3 joins can remove stale marks.

A sensor or behavior can also call `context.getChartContext().engine.registerGeometry`
for an independent registration, with explicit series IDs and SVG coordinates.
Its `update` replaces only its own geometry; its `dispose` belongs in cleanup.
Custom owner updates do not rebuild the root index. When registrations share a
series/index identity, the most recently registered custom owner takes precedence;
disposing it reveals the previous owner. Prefer unique identities for unrelated marks.

## Notes

- D3 is a peer dependency — install separately
- Accessors accept both string keys (`x="month"`) and functions (`x={(d) => d.month}`)
- Passing `sensors` replaces pointer defaults while preserving baseline keyboard navigation; `behaviors` replaces default behaviors.
- Sensors write to the store via `upsertInteraction`; behaviors read via `subscribe` + `getInteraction`
- Custom sensors use closure state (not React state) since they run outside React's lifecycle
- Behaviors must return a cleanup function that unsubscribes from the store and removes D3 elements
- Tag custom DOM elements with `chartDataAttrs` constants so the SpatialMap can detect them during hit testing
- Supports touch interactions, keyboard navigation, and responsive sizing automatically

## Bar orientation, thickness, and stacks

These options belong to `Chart.Series` with `type="bar"`:

| Prop          | Type                         | Default                       | Behavior                                                                                |
| ------------- | ---------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| `orientation` | `"vertical" \| "horizontal"` | Inherited, otherwise vertical | First explicit declaration establishes the orientation. Omitted siblings inherit it.    |
| `barWidth`    | `number \| "auto"`           | `"auto"`                      | Thickness in pixels, centered in the category band; automatic thickness fills the band. |
| `stackId`     | `string`                     | Unstacked                     | Adds preceding series values for the same category and stack ID.                        |

Accessors describe physical axes: horizontal bars use numeric `x` and category `y`; vertical bars use category `x` and numeric `y`. Functions and property keys both work.

```tsx
<Chart.Root data={rows} type="bar" x="actual" y="category">
  <Chart.Plot>
    <Chart.Grid />
    <Chart.Series
      type="bar"
      orientation="horizontal"
      x="actual"
      label="Actual"
      stackId="sales"
      barWidth={28}
    />
    <Chart.Series
      type="bar"
      x="forecast"
      label="Forecast"
      stackId="sales"
      barWidth={28}
    />
    <Chart.Axis />
  </Chart.Plot>
</Chart.Root>
```

Stacks align by category value, including when each series supplies its own reordered or sparse `data`. Positive and negative values accumulate separately from zero. Domains update from fresh totals when data changes or a series is removed. Only outward ends are rounded; internal seams are square. Use equal thicknesses within a stack for aligned edges.

Different stack IDs accumulate independently. They share the category center rather than creating side-by-side groups. Unstacked bars also share that center; different `barWidth` values support overlays such as target versus actual. Zero values have no visible area.

All bars in one chart share an orientation. A later explicitly conflicting series is omitted with a console diagnostic. Use separate charts for different orientations. Mixed line/area/scatter and bar charts are supported with vertical bars and shared compatible axes; root line domains are retained and expanded to include bar totals. Non-bar series on horizontal bar axes are omitted with a console diagnostic; use separate charts.

Default hover and keyboard navigation use each series' own matching category row. Horizontal tooltips and accessible bar labels read category followed by value. Arrow keys navigate categories; Escape clears the focused reading. Live-region DOM tests cover emitted text, not screen-reader behavior.

## Performance verification

`npm run test:performance:chart` runs the isolated Chromium dense-scatter
benchmark, reporting activation cost and warmed frame/handler percentiles.
Compare runs on the same machine and browser; these timings are informational.
Normal browser CI retains deterministic bounds on spatial query counts and
mark-style writes. It also runs custom brush, multi-pointer, keyboard, linked
streaming, geometry, and behavior-ownership regressions.
