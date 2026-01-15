# Chart Component

## Import

```tsx
import { Chart } from "doom-design-system";
```

## Props

| Prop            | Type                         | Default     | Description                         |
| --------------- | ---------------------------- | ----------- | ----------------------------------- |
| `data`          | `T[]`                        | required    | Data array                          |
| `x`             | `(d: T) => string \| number` | required    | Accessor function for X-axis values |
| `y`             | `(d: T) => number`           | required    | Accessor function for Y-axis values |
| `type`          | `"line" \| "area" \| "bar"`  | —           | Chart type (shorthand API)          |
| `title`         | `string \| ReactNode`        | —           | Chart title                         |
| `subtitle`      | `string`                     | —           | Chart subtitle                      |
| `withLegend`    | `boolean`                    | —           | Show legend                         |
| `withFrame`     | `boolean`                    | `true`      | Render card frame around chart      |
| `variant`       | `"default" \| "solid"`       | `"default"` | Visual variant                      |
| `flat`          | `boolean`                    | `false`     | Remove shadow                       |
| `d3Config`      | `ChartConfig`                | —           | D3 configuration options            |
| `render`        | `(ctx: DrawContext) => void` | —           | Custom D3 render function           |
| `renderTooltip` | `(data: T) => ReactNode`     | —           | Custom tooltip renderer             |
| `onValueChange` | `(data: T \| null) => void`  | —           | Callback when hovered value changes |
| `style`         | `CSSProperties`              | —           | Inline styles                       |
| `className`     | `string`                     | —           | CSS class name                      |

## D3 Config

```tsx
const d3Config = {
  margin: { top: 20, right: 20, bottom: 40, left: 50 },
  grid: true,
  withGradient: true,
  showDots: true,
  hideYAxisDomain: true,
  xAxisLabel: "Month",
  yAxisLabel: "Revenue (USD)",
  curve: d3Shape.curveMonotoneX, // requires import from d3-shape
  animate: true,
};
```

## Usage

### Shorthand API

```tsx
const data = [
  { month: "Jan", revenue: 4500 },
  { month: "Feb", revenue: 5200 },
  { month: "Mar", revenue: 4900 },
];

<Chart
  type="area"
  data={data}
  x={(d) => d.month}
  y={(d) => d.revenue}
  title="Monthly Revenue"
  withLegend
  d3Config={{ grid: true, withGradient: true }}
/>;
```

### Composition API

```tsx
<Chart.Root
  data={data}
  x={(d) => d.label}
  y={(d) => d.value}
  d3Config={{ grid: true, showDots: true }}
>
  <Chart.Header title="Sales" subtitle="Last 12 months">
    <Chart.Legend />
  </Chart.Header>
  <Chart.Plot type="area" color="var(--primary)" />
  <Chart.Footer>Custom footer content</Chart.Footer>
</Chart.Root>
```

### Custom D3 Render

```tsx
<Chart
  data={pieData}
  x={(d) => d.label}
  y={(d) => d.value}
  d3Config={{ showAxes: false, grid: false }}
  render={(ctx) => {
    // Full D3 access via ctx.g (SVG group)
    // ctx.data, ctx.xScale, ctx.yScale available
  }}
/>
```

## Guidelines

- Use shorthand API for simple line/area/bar charts.
- Use composition API for custom layouts with headers/footers.
- Use `render` prop for fully custom D3 visualizations (pie, treemap, etc.).
- Built on D3.js with full access to scales and selections.
- Supports touch interactions and responsive sizing.
