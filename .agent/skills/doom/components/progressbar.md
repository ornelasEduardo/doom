# ProgressBar Component

## Import

```tsx
import { ProgressBar } from "doom-design-system";
```

## Props

| Prop          | Type               | Default            | Description                    |
| ------------- | ------------------ | ------------------ | ------------------------------ |
| `value`       | `number`           | required           | Current value (0-100 or 0-max) |
| `max`         | `number`           | `100`              | Maximum value                  |
| `height`      | `string \| number` | `"24px"`           | Bar height                     |
| `color`       | `string`           | `"var(--primary)"` | Fill color                     |
| `showStripes` | `boolean`          | `true`             | Show animated stripes          |
| `label`       | `ReactNode`        | —                  | Label above the bar            |

## Usage

```tsx
<ProgressBar value={75} />

<ProgressBar
  value={uploadProgress}
  max={100}
  label="Uploading..."
  color="var(--success)"
/>
```

## Guidelines

- Value is automatically clamped to 0-max range.
- Stripes provide visual feedback for in-progress states.
- Set `showStripes={false}` for static/completed states.
