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
| `x` | `(d: T) => string \| number` | required | X-axis accessor |
| `y` | `(d: T) => number` | required | Y-axis accessor |
| `type` | `"line" \| "area" \| "bar"` | — | Chart type (shorthand API) |
| `title` | `string \| ReactNode` | — | Chart title |
| `subtitle` | `string` | — | Chart subtitle |
| `withLegend` | `boolean` | — | Show legend |
| `withFrame` | `boolean` | `true` | Render card frame around chart |
| `variant` | `"default" \| "solid"` | `"default"` | Visual variant |
| `flat` | `boolean` | `false` | Remove shadow |
| `d3Config` | `Config` | — | D3 configuration options |
| `render` | `(frame: RenderFrame<T>) => void` | — | Custom D3 render function |
| `onValueChange` | `(data: T \| null) => void` | — | Callback when hovered value changes |
| `style` | `CSSProperties` | — | Inline styles |
| `className` | `string` | — | CSS class name |

## d3Config Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `margin` | `{ top: number; right: number; bottom: number; left: number }` | — | Chart margins |
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

## RenderFrame Type

| Field | Type | Description |
|-------|------|-------------|
| `container` | `D3Selection<T>` | SVG container selection |
| `data` | `T[]` | Chart data |
| `size` | `{ width: number; height: number; radius: number }` | Chart dimensions |
| `scales` | `{ x?: XScale; y?: YScale }` | D3 scale instances |
| `theme` | `{ colors: string[]; isMobile: boolean }` | Theme values |
| `config` | `Config` | Active d3Config |
| `seriesId` | `string` | Series identifier |
| `resolveInteraction` | `(event) => { element: Element; data: T } \| null` | Hit-test helper |
| `chartDataAttrs` | `{ TYPE, SERIES_ID, INDEX, DRAGGABLE }` | DOM data attributes |

## Usage

```tsx
// Shorthand API — simple line/area/bar chart
const data = [
  { month: "Jan", revenue: 4500 },
  { month: "Feb", revenue: 5200 },
];

<Chart
  type="area"
  data={data}
  x={(d) => d.month}
  y={(d) => d.revenue}
  title="Monthly Revenue"
  withLegend
  d3Config={{ grid: true, withGradient: true, animate: true }}
/>

// Composition API — custom layouts
<Chart.Root data={data} x={(d) => d.label} y={(d) => d.value} d3Config={{ grid: true }}>
  <Chart.Header title="Sales" subtitle="Last 12 months">
    <Chart.Legend />
  </Chart.Header>
  <Chart.Plot type="area" color="var(--primary)" />
  <Chart.Footer>Custom footer content</Chart.Footer>
</Chart.Root>

// Custom D3 render — for pie, treemap, etc.
<Chart
  data={pieData}
  x={(d) => d.label}
  y={(d) => d.value}
  d3Config={{ showAxes: false, grid: false }}
  render={(frame) => {
    // frame.container is the SVG group — use full D3 API here
    // frame.scales, frame.data, frame.size, frame.theme available
  }}
/>
```

## Notes
- D3 is a peer dependency — install separately: `npm install d3`
- Use shorthand API (`type="line"`) for standard charts; use `render` for custom viz (pie, treemap)
- `render` prop receives `RenderFrame<T>` — use `frame.container` (D3 selection) to draw
- Supports touch interactions and responsive sizing automatically
- Use `d3Config.showAxes: false` with custom `render` to hide default axes
