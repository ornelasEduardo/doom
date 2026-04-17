# Rating

## Import

```tsx
import { Rating } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | -- | Controlled value |
| `defaultValue` | `number` | `0` | Uncontrolled initial value |
| `onValueChange` | `(value: number) => void` | -- | Change callback |
| `count` | `number` | `5` | Number of icons |
| `icon` | `LucideIcon` | `Star` | Icon component to render |
| `allowHalf` | `boolean` | `false` | Enable half-value selection |
| `size` | `ControlSize` | `"md"` | Icon size (`"sm"`, `"md"`, `"lg"`) |
| `readOnly` | `boolean` | `false` | Display-only mode |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | -- | Additional CSS classes |
| `aria-label` | `string` | -- | Accessible label |

## Usage

```tsx
// Basic
<Rating defaultValue={3} aria-label="Product rating" />

// Controlled with half values
<Rating
  value={rating}
  onValueChange={setRating}
  allowHalf
  aria-label="Rating"
/>

// Custom icon and count
<Rating defaultValue={7} icon={Heart} count={10} aria-label="Love rating" />

// Read-only display
<Rating value={4.5} readOnly allowHalf aria-label="4.5 out of 5" />
```

## Notes

- Supports controlled (`value`) and uncontrolled (`defaultValue`) modes
- `allowHalf` enables 0.5 step increments and renders half-filled icons via clip-path
- Read-only mode uses `role="img"` instead of `role="radiogroup"`
- Interactive mode uses `role="radiogroup"` with individual `role="radio"` buttons
- Keyboard: ArrowLeft/Right to change value, Home/End for min/max, steps by 0.5 when `allowHalf`
- Icons are rendered via `React.createElement(icon, { size, strokeWidth: 2.5 })` matching lucide-react convention
- Filled icons use `--warning` color, unfilled use `--muted`
