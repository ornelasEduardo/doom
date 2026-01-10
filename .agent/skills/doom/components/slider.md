# Slider Component

## Import

```tsx
import { Slider } from "doom-design-system";
```

## Props

| Prop           | Type                         | Default | Description                        |
| -------------- | ---------------------------- | ------- | ---------------------------------- |
| `label`        | `string`                     | —       | Label text                         |
| `showValue`    | `boolean`                    | —       | Display current value              |
| `value`        | `number \| [number, number]` | —       | Controlled value (single or range) |
| `defaultValue` | `number \| [number, number]` | —       | Uncontrolled initial value         |
| `onChange`     | `(value) => void`            | —       | Change handler                     |
| `min`          | `number`                     | `0`     | Minimum value                      |
| `max`          | `number`                     | `100`   | Maximum value                      |
| `step`         | `number`                     | `1`     | Step increment                     |

## Usage

```tsx
// Single value slider
<Slider
  label="Volume"
  showValue
  value={volume}
  onChange={setVolume}
/>

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

## Guidelines

- Pass `[number, number]` tuple for range slider (two thumbs).
- Range slider prevents thumbs from crossing each other.
- Use `showValue` to display the current value.
