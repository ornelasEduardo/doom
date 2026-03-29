# ProgressBar

## Import
```tsx
import { ProgressBar } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value (0–max) |
| `max` | `number` | `100` | Maximum value |
| `height` | `string \| number` | `"24px"` | Bar height |
| `color` | `string` | `"var(--primary)"` | Fill color (any CSS color) |
| `showStripes` | `boolean` | `true` | Show animated diagonal stripes |
| `label` | `ReactNode` | — | Label rendered above the bar |

## Usage

```tsx
// Basic progress
<ProgressBar value={75} />

// Upload progress with label
<ProgressBar value={uploadProgress} max={100} label="Uploading..." color="var(--success)" />

// Completed state — no stripes
<ProgressBar value={100} showStripes={false} color="var(--success)" label="Complete" />
```

## Notes
- Value is automatically clamped to `0`–`max` range
- Animated stripes signal in-progress state — set `showStripes={false}` for static/completed bars
- `color` accepts any CSS value (hex, `var()`, etc.)
