# Alert

## Import
```tsx
import { Alert } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Visual style |
| `title` | `string` | required | Alert heading |
| `description` | `ReactNode` | — | Additional detail content |
| `icon` | `ReactNode` | — | Custom icon (defaults per variant) |

## Usage

```tsx
// Error alert with description
<Alert
  variant="error"
  title="Invalid credentials"
  description="Please check your email and password."
/>

// Success alert
<Alert variant="success" title="Changes saved!" />
```

## Variants

| Variant | Use case |
|---------|----------|
| `info` | General notices |
| `success` | Confirmations, completions |
| `warning` | Cautions, deprecations |
| `error` | Form validation, API errors |

## Notes
- Each variant has a default icon — override with `icon` prop only when needed
- `description` accepts `ReactNode` so you can include links or formatted content
