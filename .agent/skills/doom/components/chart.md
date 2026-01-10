# Chart Component

## Import

```tsx
import { Chart } from "doom-design-system";
```

## Props

| Prop            | Type                        | Default  | Description                |
| --------------- | --------------------------- | -------- | -------------------------- |
| `data`          | `T[]`                       | required | Data array                 |
| `config`        | `ChartConfig`               | required | Series configuration       |
| `type`          | `"line" \| "area" \| "bar"` | —        | Chart type (shorthand API) |
| `xKey`          | `string`                    | required | X-axis data key            |
| `height`        | `number`                    | `300`    | Chart height               |
| `title`         | `string`                    | —        | Chart title                |
| `subtitle`      | `string`                    | —        | Chart subtitle             |
| `withLegend`    | `boolean`                   | —        | Show legend                |
| `render`        | `(ctx) => ReactNode`        | —        | Custom render function     |
| `renderTooltip` | `(ctx) => ReactNode`        | —        | Custom tooltip             |

## Config

```tsx
const config = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  profit: {
    label: "Profit",
    color: "var(--success)",
  },
};
```

## Usage

### Shorthand API

```tsx
<Chart
  type="line"
  data={data}
  config={config}
  xKey="month"
  title="Monthly Revenue"
  withLegend
/>
```

### Composition API

```tsx
<Chart.Root data={data} config={config} xKey="month">
  <Chart.Header title="Sales" subtitle="Last 12 months">
    <Chart.Legend />
  </Chart.Header>
  <Chart.Plot type="area" />
  <Chart.Footer>Custom footer</Chart.Footer>
</Chart.Root>
```

## Guidelines

- Use shorthand API for simple charts.
- Use composition API for custom layouts.
- Built on D3.js; supports line, area, and bar charts.
- Supports gradients with `withGradient` prop on Plot.
