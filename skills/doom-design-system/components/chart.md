# Chart

## Import
```tsx
import { Chart } from "doom-design-system";
```

Peer dependency: `npm install d3`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Data array |
| `x` | `keyof T \| (d: T) => string \| number` | required | X-axis accessor (string key or function) |
| `y` | `keyof T \| (d: T) => number` | required | Y-axis accessor (string key or function) |
| `type` | `"line" \| "area" \| "bar" \| "scatter"` | — | Chart type (shorthand API) |
| `title` | `string \| ReactNode` | — | Chart title |
| `subtitle` | `string` | — | Chart subtitle |
| `withLegend` | `boolean` | — | Show legend |
| `withFrame` | `boolean` | `true` | Render card frame around chart |
| `variant` | `"default" \| "solid"` | `"default"` | Visual variant |
| `flat` | `boolean` | `false` | Remove shadow |
| `d3Config` | `Config` | — | D3 configuration options |
| `render` | `(frame: RenderFrame<T>) => void` | — | Custom D3 render function |
| `sensors` | `Sensor[]` | — | Custom sensors (replaces defaults) |
| `behaviors` | `Behavior[]` | — | Custom behaviors (replaces defaults) |
| `onValueChange` | `(data: T \| null) => void` | — | Callback when hovered value changes |
| `style` | `CSSProperties` | — | Inline styles |
| `className` | `string` | — | CSS class name |

## d3Config Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `margin` | `{ top, right, bottom, left }` | — | Chart margins |
| `width` | `number` | — | Fixed width override |
| `height` | `number` | — | Fixed height override |
| `curve` | `d3Shape.CurveFactory` | — | D3 curve factory (e.g. `curveMonotoneX`) |
| `showAxes` | `boolean` | `true` | Show X/Y axes |
| `xAxisLabel` | `string` | — | X-axis label text |
| `yAxisLabel` | `string` | — | Y-axis label text |
| `grid` | `boolean` | — | Show grid lines |
| `withGradient` | `boolean` | — | Fill area with gradient |
| `showDots` | `boolean` | — | Show data point dots |
| `hideYAxisDomain` | `boolean` | — | Hide Y-axis domain line |
| `animate` | `boolean` | — | Animate on mount |
| `type` | `SeriesType` | — | Series type override within config |

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
  d3Config={{ grid: true, withGradient: true, animate: true }}
/>

// Composition API — custom layouts
<Chart.Root data={data} x="label" y="value" d3Config={{ grid: true }}>
  <Chart.Header title="Sales" subtitle="Last 12 months">
    <Chart.Legend />
  </Chart.Header>
  <Chart.Plot type="area" color="var(--primary)" />
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

## Architecture

The Chart uses a layered pipeline: **Engine → Sensors → Store → Behaviors**.

```
Browser Event (pointer/touch/keyboard)
  → InteractionLayer (RAF throttling)
    → Engine.input(InputSignal)
      → SpatialMap.find() + CoordinateSystem (hit detection)
        → Scheduler (priority queue)
          → Sensors (process EngineEvent, update store)
            → Store (interactions map triggers subscriptions)
              → Behaviors (subscribe to store, update D3 visuals)
```

### Engine

Pure, DOM-independent orchestrator. Converts raw input into processed `EngineEvent`s with hit-test candidates.

**Key files:** `Chart/engine/Engine.ts`, `engine/SpatialMap.ts`, `engine/CoordinateSystem.ts`, `engine/Scheduler.ts`

- **InputSignal** — Normalized input format: `{ id, action, source, x, y, timestamp, key?, modifiers? }`
  - Actions: `START`, `MOVE`, `END`, `CANCEL`, `KEY`
  - Sources: `MOUSE`, `TOUCH`, `KEYBOARD`, `REMOTE`
- **SpatialMap** — Hybrid hit detection: DOM `elementsFromPoint()` broad phase + quadtree fine phase. Configurable `magneticRadius` (default 20px) for snapping.
- **CoordinateSystem** — Transforms client → container → plot-relative coordinates.
- **Scheduler** — Priority-based: `CRITICAL` (sync, for pointer down/up), `VISUAL` (RAF-batched, for moves), `IDLE` (requestIdleCallback). Visual queue coalesces events per pointer ID.

### EngineEvent

The processed output sensors receive:

| Field | Type | Description |
|-------|------|-------------|
| `signal` | `InputSignal` | Raw normalized input |
| `candidates` | `InteractionCandidate<T>[]` | All hit results, sorted by relevance |
| `primaryCandidate` | `InteractionCandidate<T>` | Closest/most relevant hit |
| `sliceCandidates` | `InteractionCandidate<T>[]` | All series points at primary's X (vertical slice) |
| `chartX` | `number` | X relative to plot area |
| `chartY` | `number` | Y relative to plot area |
| `isWithinPlot` | `boolean` | Whether pointer is inside the plot bounds |

### InteractionCandidate

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"data-point" \| "bar" \| "area" \| "label" \| "axis" \| "legend-item" \| "custom"` | Hit target type |
| `data` | `T` | The underlying data object |
| `seriesId` | `string` | Series identifier |
| `dataIndex` | `number` | Index in data array |
| `seriesColor` | `string` | Series color |
| `coordinate` | `{ x, y }` | Pixel coordinates |
| `distance` | `number` | Distance from pointer |
| `element` | `Element` | DOM element hit |
| `draggable` | `boolean` | Whether target is draggable |

### Store (State Management)

Unified store with slices: `lifecycle`, `dimensions`, `data`, `series`, `interactions`, `scales`.

Key operations:
- `upsertInteraction(store, name, payload)` — Write to interactions map
- `removeInteraction(store, name)` — Delete from interactions map
- `chartStore.subscribe(listener)` — Subscribe to changes (used by behaviors)
- `chartStore.useStore(selector?)` — React hook via `useSyncExternalStore`

### Interaction Channels

| Channel | Constant | Used By |
|---------|----------|---------|
| `"primary-hover"` | `InteractionChannel.PRIMARY_HOVER` | DataHoverSensor, KeyboardSensor |
| `"selection"` | `InteractionChannel.SELECTION` | SelectionSensor |
| `"drag"` | `InteractionChannel.DRAG` | DragSensor |
| `"cursor-config"` | `InteractionChannel.CURSOR_CONFIG` | Cursor behavior |
| `"tooltip-config"` | `InteractionChannel.TOOLTIP_CONFIG` | Tooltip behavior |
| `"crosshair"` | `InteractionChannel.CROSSHAIR` | Custom crosshair state |

## Series System

Each series type registers itself with the store and gets an automatic interaction strategy:

| Condition | Strategy | Complexity |
|-----------|----------|------------|
| < 50 items | `LinearStrategy` | O(n) scan |
| line/area (sorted X) | `BinaryXStrategy` | O(log n) bisect |
| scatter/bubble | `QuadtreeStrategy` | O(log n) spatial |
| Fallback | `LinearStrategy` | O(n) scan |

**Key files:** `subcomponents/Series/`, `subcomponents/{LineSeries,BarSeries,ScatterSeries,CustomSeries}/`, `sensors/utils/strategies/`

## Sensors

Sensors receive `EngineEvent`s and write to the interaction store. They are stateless functions with closure-based internal state.

### Type Signature

```tsx
type Sensor<T = unknown> = (
  event: EngineEvent<T>,
  context: SensorContext<T>,
) => void;

interface SensorContext<T> {
  getChartContext: () => ContextValue<T>;
  getInteraction: (name: string) => Interaction | null;
  upsertInteraction: (name: string, interaction: Interaction) => void;
  removeInteraction: (name: string) => void;
}
```

### Built-in Sensors

| Sensor | Options | Description |
|--------|---------|-------------|
| `DataHoverSensor` | `{ name?, exactHit?, verticalSlice? }` | Tracks pointer hover, writes `HoverInteraction` |
| `KeyboardSensor` | `{ name? }` | Arrow key navigation through data points (a11y) |
| `DragSensor` | `{ name?, onDrag?, onDragEnd?, hitRadius? }` | Drag-to-edit with scale inversion |
| `SelectionSensor` | `{ name? }` | Click-to-select with toggle support |

**Defaults by chart type:**
- line/area/bar: `DataHoverSensor({ verticalSlice: true })` + `KeyboardSensor`
- scatter/bubble/custom: `DataHoverSensor()` + `KeyboardSensor`

### Creating a Custom Sensor

```tsx
import { InputAction, type Sensor, type EngineEvent, type SensorContext } from "./types";

interface RangeSensorOptions {
  name?: string;
  onRangeComplete?: (start: number, end: number) => void;
}

export const RangeSensor = (options: RangeSensorOptions = {}): Sensor => {
  const { name = "range-selection", onRangeComplete } = options;

  // Closure state persists across calls
  let rangeStart: number | null = null;

  return (event: EngineEvent, context: SensorContext) => {
    const { signal, chartX, isWithinPlot } = event;

    if (!isWithinPlot) {
      rangeStart = null;
      context.removeInteraction(name);
      return;
    }

    switch (signal.action) {
      case InputAction.START:
        rangeStart = chartX;
        break;

      case InputAction.MOVE:
        if (rangeStart !== null) {
          context.upsertInteraction(name, {
            start: Math.min(rangeStart, chartX),
            end: Math.max(rangeStart, chartX),
            isActive: true,
          });
        }
        break;

      case InputAction.END:
        if (rangeStart !== null) {
          const start = Math.min(rangeStart, chartX);
          const end = Math.max(rangeStart, chartX);
          context.upsertInteraction(name, { start, end, isActive: false });
          onRangeComplete?.(start, end);
          rangeStart = null;
        }
        break;

      case InputAction.CANCEL:
        rangeStart = null;
        context.removeInteraction(name);
        break;
    }
  };
};
```

Register by passing to `sensors` prop (replaces all defaults — include `DataHoverSensor` if you still want hover):

```tsx
<Chart
  data={data}
  type="bar"
  x="month"
  y="value"
  sensors={[
    DataHoverSensor({ verticalSlice: true }),
    KeyboardSensor(),
    RangeSensor({ onRangeComplete: (start, end) => console.log(start, end) }),
  ]}
/>
```

## Behaviors

Behaviors subscribe to the store and update D3 visuals in response to interaction changes. They run once when the chart is "ready" and return a cleanup function.

### Type Signature

```tsx
type Behavior<T = any> = (context: BehaviorContext<T>) => Cleanup | void;
type Cleanup = () => void;

interface BehaviorContext<T> {
  getChartContext: () => ContextValue<T> & {
    g: D3Selection | null;  // SVG plot group — use for D3 rendering
  };
  getInteraction: (name: string) => Interaction | null;
  upsertInteraction: (name: string, interaction: any) => void;
  removeInteraction: (name: string) => void;
}
```

### Built-in Behaviors

| Behavior | Options | Description |
|----------|---------|-------------|
| `Tooltip` | `{ on?, render? }` | Positions tooltip near pointer |
| `Cursor` | `{ on?, showX?, showY? }` | Vertical/horizontal crosshair lines |
| `Markers` | `{ on?, radius?, color? }` | Circles at hovered data points |
| `Dim` | `{ on?, selector?, opacity? }` | Dims non-hovered elements (default 0.3 opacity) |
| `Selection` | `{ mode?, on?, onSelectionChange? }` | Manages selected data, fires callback |
| `DraggablePuck` | `{ on?, radius?, color?, showGhost? }` | Visual feedback for drag (puck + ghost + connecting line) |

**Defaults by chart type:**
- All types: `Tooltip` + `Cursor({ showX: true })`
- line/area: + `Markers({ radius: 8 })`
- bar/scatter: + `Dim`

### Creating a Custom Behavior

```tsx
import type { Behavior, InteractionTarget } from "./types";

interface HighlightRangeOptions {
  on?: string;          // Interaction channel to listen to
  color?: string;
}

export const HighlightRange = (options: HighlightRangeOptions = {}): Behavior => {
  const { on = "range-selection", color = "var(--primary)" } = options;

  return (context) => {
    const ctx = context.getChartContext();
    if (!ctx?.g) return;

    const { g, chartStore } = ctx;

    // Create a D3 layer for the highlight rectangle
    const layer = g.append("g").attr("class", "range-highlight-layer");
    const rect = layer
      .append("rect")
      .attr("fill", color)
      .attr("opacity", 0.15)
      .attr("y", 0)
      .attr("height", chartStore.getState().dimensions.innerHeight)
      .style("display", "none");

    // Subscribe to store — runs on every interaction change
    const unsubscribe = chartStore.subscribe(() => {
      const interaction = context.getInteraction(on) as any;

      if (!interaction || !interaction.isActive) {
        rect.style("display", "none");
        return;
      }

      const { start, end } = interaction;
      rect
        .attr("x", start)
        .attr("width", end - start)
        .style("display", null);
    });

    // Cleanup: remove DOM elements and unsubscribe
    return () => {
      unsubscribe();
      layer.remove();
    };
  };
};
```

Register by passing to `behaviors` prop (replaces all defaults — include `Tooltip`/`Cursor` if you still want them):

```tsx
<Chart
  data={data}
  type="bar"
  x="month"
  y="value"
  sensors={[
    DataHoverSensor({ verticalSlice: true }),
    RangeSensor(),
  ]}
  behaviors={[
    Tooltip(),
    Cursor({ showX: true }),
    HighlightRange({ on: "range-selection", color: "var(--primary)" }),
  ]}
/>
```

## Composition API Subcomponents

| Subcomponent | Description |
|-------------|-------------|
| `Chart.Root` | Creates store + engine, provides context, manages resize |
| `Chart.Header` | Title + subtitle container, accepts `<Chart.Legend />` as child |
| `Chart.Footer` | Footer content below the chart |
| `Chart.Legend` | Series legend |
| `Chart.Plot` | SVG wrapper with proper transforms |
| `Chart.Series` | Router: switches on `type` to `LineSeries`, `BarSeries`, `ScatterSeries`, or `CustomSeries` |
| `Chart.Grid` | Grid lines |
| `Chart.Axis` | X/Y axes with labels |
| `Chart.Cursor` | Crosshair lines (reads from `CURSOR_CONFIG` channel) |

## RenderFrame Type

Available in the `render` prop and `CustomSeries`:

| Field | Type | Description |
|-------|------|-------------|
| `container` | `D3Selection<T>` | SVG group — use for D3 rendering |
| `data` | `T[]` | Chart data |
| `size` | `{ width, height, radius }` | Plot dimensions |
| `scales` | `{ x?: XScale, y?: YScale }` | D3 scale instances |
| `theme` | `{ colors: string[], isMobile: boolean }` | Theme values |
| `config` | `Config` | Active d3Config |
| `seriesId` | `string` | Series identifier |
| `resolveInteraction` | `(event) => { element, data } \| null` | Hit-test helper |
| `chartDataAttrs` | `{ TYPE, SERIES_ID, INDEX, DRAGGABLE }` | DOM data attributes for hit detection |

## Notes

- D3 is a peer dependency — install separately
- Accessors accept both string keys (`x="month"`) and functions (`x={(d) => d.month}`)
- Passing `sensors` or `behaviors` replaces all defaults — include built-in ones you want to keep
- Sensors write to the store via `upsertInteraction`; behaviors read via `subscribe` + `getInteraction`
- Custom sensors use closure state (not React state) since they run outside React's lifecycle
- Behaviors must return a cleanup function that unsubscribes from the store and removes D3 elements
- Tag custom DOM elements with `chartDataAttrs` constants so the SpatialMap can detect them during hit testing
- Supports touch interactions, keyboard navigation, and responsive sizing automatically
