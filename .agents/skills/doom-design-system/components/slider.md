# Slider

## Import
```tsx
import { Slider } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Label text |
| `showValue` | `boolean` | — | Display current value |
| `value` | `number \| [number, number]` | — | Controlled value — tuple enables range mode |
| `defaultValue` | `number \| [number, number]` | — | Uncontrolled initial value |
| `onChange` | `(value: number \| [number, number]) => void` | — | Change handler |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |

## Usage

```tsx
// Single value slider
<Slider label="Volume" showValue value={volume} onChange={setVolume} />

// Range slider
<Slider
  label="Price Range"
  showValue
  value={[minPrice, maxPrice]}
  onChange={([min, max]) => {
    setMinPrice(min);
    setMaxPrice(max);
  }}
  min={0}
  max={1000}
/>
```

## Notes
- Pass a `[number, number]` tuple to enable range mode (two thumbs)
- Range mode prevents thumbs from crossing each other
- Single and range modes are determined by the shape of `value` / `defaultValue` — do not mix types between renders
